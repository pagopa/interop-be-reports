import { SafeMap } from '@interop-be-reports/commons'
import { AgreementsWorksheetTableData, DescriptorsWorksheetTableData } from '../models/excel.model.js'
import { AgreementQueryData, EServiceQueryData, PurposeQueryData, TenantQueryData } from '../models/query-data.model.js'

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
