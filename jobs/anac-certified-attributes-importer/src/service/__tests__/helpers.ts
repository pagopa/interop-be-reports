import { ANAC_ABILITATO_CODE, ANAC_INCARICATO_CODE, ANAC_IN_CONVALIDA_CODE } from "../../config/index.js"
import { InteropContext, PersistentAttribute, PersistentTenant, PersistentTenantAttribute } from "../../model/index.js"

export const sftpConfigTest = {
  host: "host",
  port: 1,
  username: "user",
  privateKey: "key",
  filePath: "/"
}

const csvFileContent =
  `cf_gestore,denominazione,domicilio_digitale,codice_ipa,anac_incaricato,anac_abilitato,anac_in_convalida
0123456789,Nome ente presente in IPA,gsp1@pec.it,DRMEST,TRUE,FALSE,TRUE
0011223344,E-Procurement 1,eprocurement1@pec.it,,TRUE,TRUE,FALSE
0011223344,"E-Procurement 2 con , virgola nel nome",eprocurement1@pec.it,,TRUE,TRUE,FALSE`


export const ATTRIBUTE_ANAC_INCARICATO_ID = 'b1d64ee0-fda9-48e2-84f8-1b62f1292b47'
export const ATTRIBUTE_ANAC_ABILITATO_ID = 'dc77c852-7635-4522-bc1c-e431c5d68b55'
export const ATTRIBUTE_ANAC_IN_CONVALIDA_ID = '97dec753-8a6e-4a25-aa02-95ac8602b364'

export const downloadCSVMock = (): Promise<string> => Promise.resolve(csvFileContent)

export const internalAssignCertifiedAttributeMock = (_tenantOrigin: string, _tenantExternalId: string, _attributeOrigin: string, _attributeExternalId: string, _context: InteropContext): Promise<void> => Promise.resolve()
export const internalRevokeCertifiedAttributeMock = (_tenantOrigin: string, _tenantExternalId: string, _attributeOrigin: string, _attributeExternalId: string, _context: InteropContext): Promise<void> => Promise.resolve()

export const getPATenantsMock = (ipaCodes: string[]): Promise<PersistentTenant[]> => Promise.resolve(ipaCodes.map(c => ({ ...persistentTenant, externalId: { origin: 'tenantOrigin', value: c } })))
export const getNonPATenantsMock = (taxCodes: string[]): Promise<PersistentTenant[]> => Promise.resolve(taxCodes.map(c => ({ ...persistentTenant, externalId: { origin: 'tenantOrigin', value: c } })))
export const getTenantByIdMock = (tenantId: string): Promise<PersistentTenant> => Promise.resolve({ ...persistentTenant, id: tenantId })
export const getAttributeByExternalIdMock = (origin: string, code: string): Promise<PersistentAttribute> =>
// Promise.resolve({ ...persistentAttribute, origin, code })
{
  switch (code) {
    case ANAC_ABILITATO_CODE:
      return Promise.resolve({ ...persistentAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID, origin, code })
    case ANAC_IN_CONVALIDA_CODE:
      return Promise.resolve({ ...persistentAttribute, id: ATTRIBUTE_ANAC_IN_CONVALIDA_ID, origin, code })
    case ANAC_INCARICATO_CODE:
      return Promise.resolve({ ...persistentAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID, origin, code })
    default:
      return Promise.reject(new Error('Unexpected attribute code'))
  }
}

export const persistentTenant: PersistentTenant = {
  id: '091fbea1-0c8e-411b-988f-5098b6a33ba7',
  externalId: { origin: 'tenantOrigin', value: 'tenantValue' },
  attributes: [],
  features: [{ type: 'PersistentCertifier', certifierId: 'ANAC' }],
}

export const persistentAttribute: PersistentAttribute = {
  id: '7a04c906-1525-4c68-8a5b-d740d77d9c80',
  origin: 'attributeOrigin',
  code: 'attributeCode'
}

export const persistentTenantAttribute: PersistentTenantAttribute = {
  id: '7a04c906-1525-4c68-8a5b-d740d77d9c80',
  type: 'PersistentCertifiedAttribute',
  assignmentTimestamp: new Date()
}