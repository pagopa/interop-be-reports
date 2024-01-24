import { AthenaClientService, SafeMap, logError, logInfo, logWarn } from '@interop-be-reports/commons'
import {
  AgreementsWorksheetTableData,
  DescriptorsWorksheetTableData,
  TokensWorksheetTableData,
} from '../models/excel.model.js'
import { AgreementQueryData, EServiceQueryData, PurposeQueryData, TenantQueryData } from '../models/query-data.model.js'
import { env } from '../configs/env.js'
import { randomUUID } from 'crypto'

const cidJob = randomUUID()

export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}

export function getAllTenantsIdsFromAgreements<TAgreement extends { consumerId: string; producerId: string }>(
  agreements: TAgreement[]
): string[] {
  const extractTenantsFromAgreement = (agreement: TAgreement): [string, string] => [
    agreement.consumerId,
    agreement.producerId,
  ]
  const tenantsIds = agreements.map(extractTenantsFromAgreement).flat()
  return Array.from(new Set(tenantsIds))
}

export function generateAgreementsWorksheetTableData(
  agreements: AgreementQueryData[],
  purposes: PurposeQueryData[],
  eservicesMap: SafeMap<string, EServiceQueryData>,
  tenantsMap: SafeMap<string, TenantQueryData>
): AgreementsWorksheetTableData[] {
  return agreements.map<AgreementsWorksheetTableData>((agreement) => {
    const agreementPurposes = purposes.filter((purpose) => purpose.eserviceId === agreement.eserviceId)

    return AgreementsWorksheetTableData.parse({
      EserviceId: agreement.eserviceId,
      Eservice: eservicesMap.get(agreement.eserviceId).name,
      Producer: tenantsMap.get(agreement.producerId).externalId.value,
      ProducerId: agreement.producerId,
      Consumer: tenantsMap.get(agreement.consumerId).externalId.value,
      ConsumerId: agreement.consumerId,
      Agreement: agreement.id,
      Purposes: agreementPurposes.map((purpose) => purpose.title),
      PurposeIds: agreementPurposes.map((purpose) => purpose.id),
    })
  })
}

export function generateDescriptorsWorksheetTableData(
  eservices: EServiceQueryData[],
  tenantsMap: SafeMap<string, TenantQueryData>
): DescriptorsWorksheetTableData[] {
  function isDescriptorActive(descriptor: EServiceQueryData['descriptors'][0]): boolean {
    return ['Published', 'Suspended', 'Deprecated'].includes(descriptor.state)
  }

  return eservices.flatMap((eservice) =>
    eservice.descriptors.reduce<DescriptorsWorksheetTableData[]>((acc, descriptor) => {
      if (!isDescriptorActive(descriptor)) return acc

      const interfaceChecksum = descriptor.interface?.checksum ?? ''

      const data = DescriptorsWorksheetTableData.parse({
        Name: eservice.name,
        CreatedAt: descriptor.createdAt,
        ProducerId: eservice.producerId,
        Producer: tenantsMap.get(eservice.producerId).externalId.value,
        DescriptorId: descriptor.id,
        State: descriptor.state,
        Fingerprint: interfaceChecksum,
      })
      return [...acc, data]
    }, [])
  )
}

export async function generateTokensWorksheetTableData(
  agreementsMap: Map<string, AgreementQueryData>
): Promise<TokensWorksheetTableData[]> {
  const athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })
  const { ResultSet } = await athena.query(
    `
      SELECT 
        agreementid,
        purposeid,
        date_format(from_unixtime(cast(issuedAt as bigint) / 1000), '%Y-%m-%d') as day,
        count(*) as tokens,
        expirationTime - issuedAt as tokenDuration
      FROM 
        ${env.ATHENA_TOKENS_DB_NAME} 
      GROUP BY 
        agreementid,
        purposeid,
        date_format(from_unixtime(cast(issuedAt as bigint) / 1000), '%Y-%m-%d'),
        expirationTime - issuedAt
    `
  )

  if (!ResultSet?.Rows) throw new Error('Invalid result set')

  return ResultSet.Rows.slice(1).map((row) => {
    if (!row.Data) throw new Error('Invalid row data')

    const [agreementId, purposeId, date, tokencount, tokenDuration] = row.Data.map((data) => data.VarCharValue)
    const agreementState = agreementsMap.get(agreementId ?? '')?.state ?? ''

    if (!agreementState) log.warn(`Agreement ${agreementId} not found in readmodel`)

    return TokensWorksheetTableData.parse({
      agreementId,
      purposeId,
      date,
      tokencount,
      agreementState,
      tokenDuration,
    })
  })
}
