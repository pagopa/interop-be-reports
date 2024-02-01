import { logError, logInfo, logWarn } from '@interop-be-reports/commons'
import {
  AgreementsWorksheetTableData,
  DescriptorsWorksheetTableData,
  TokensWorksheetTableData,
} from '../models/excel.model.js'
import { AgreementQueryData, EServiceQueryData, PurposeQueryData, TenantQueryData } from '../models/query-data.model.js'
import { randomUUID } from 'crypto'
import { TokensDataQueryResult } from '../services/athena-queries.service.js'

const cidJob = randomUUID()

export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}

export function generateAgreementsWorksheetTableData(
  agreements: AgreementQueryData[],
  purposes: PurposeQueryData[],
  eservicesMap: Map<string, EServiceQueryData>,
  tenantsMap: Map<string, TenantQueryData>
): AgreementsWorksheetTableData[] {
  return agreements.map<AgreementsWorksheetTableData>((agreement) => {
    const agreementPurposes = purposes.filter((purpose) => purpose.eserviceId === agreement.eserviceId)
    const consumer = tenantsMap.get(agreement.consumerId)
    const producer = tenantsMap.get(agreement.producerId)
    const eservice = eservicesMap.get(agreement.eserviceId)

    if (!consumer) log.warn(`[Agreements Worksheet] Tenant consumer ${agreement.consumerId} not found in readmodel`)
    if (!producer) log.warn(`[Agreements Worksheet] Tenant producer ${agreement.producerId} not found in readmodel`)
    if (!eservice) log.warn(`[Agreements Worksheet] Eservice ${agreement.eserviceId} not found in readmodel`)

    return {
      EserviceId: agreement.eserviceId,
      Eservice: eservice?.name ?? '',
      Producer: producer?.externalId.value ?? '',
      ProducerId: agreement.producerId,
      Consumer: consumer?.externalId.value ?? '',
      ConsumerId: agreement.consumerId,
      Agreement: agreement.id,
      Purposes: agreementPurposes.map((purpose) => purpose.title).join(','),
      PurposeIds: agreementPurposes.map((purpose) => purpose.id).join(','),
    }
  })
}

export function generateDescriptorsWorksheetTableData(
  eservices: EServiceQueryData[],
  tenantsMap: Map<string, TenantQueryData>
): DescriptorsWorksheetTableData[] {
  function isDescriptorActive(descriptor: EServiceQueryData['descriptors'][0]): boolean {
    return ['Published', 'Suspended', 'Deprecated'].includes(descriptor.state)
  }

  return eservices.flatMap((eservice) =>
    eservice.descriptors.reduce<DescriptorsWorksheetTableData[]>((acc, descriptor) => {
      if (!isDescriptorActive(descriptor)) return acc

      const interfaceChecksum = descriptor.interface?.checksum ?? ''
      const tenant = tenantsMap.get(eservice.producerId)

      if (!tenant) log.warn(`[Descriptors Worksheet] Tenant producer ${eservice.producerId} not found in readmodel`)

      const data = {
        Name: eservice.name,
        CreatedAt: descriptor.createdAt.toISOString(),
        ProducerId: eservice.producerId,
        Producer: tenant?.externalId.value ?? '',
        DescriptorId: descriptor.id,
        State: descriptor.state,
        Fingerprint: interfaceChecksum,
      }
      return [...acc, data]
    }, [])
  )
}

export function generateTokensWorksheetTableData(
  tokens: TokensDataQueryResult[],
  agreementsMap: Map<string, AgreementQueryData>
): TokensWorksheetTableData[] {
  return tokens.map(({ agreementId, purposeId, date, tokencount, tokenDuration }) => {
    const agreement = agreementsMap.get(agreementId)

    if (!agreement) log.warn(`[Tokens Worksheet] Agreement ${agreementId} not found in readmodel`)

    return {
      agreementId,
      purposeId,
      date,
      tokencount,
      agreementState: agreement?.state ?? '',
      tokenDuration,
    }
  })
}
