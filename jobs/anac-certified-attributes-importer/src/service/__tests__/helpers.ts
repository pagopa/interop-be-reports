import { InteropContext, PersistentAttribute, PersistentTenant } from "../../model/index.js"

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


export const downloadCSVMock = (): Promise<string> => Promise.resolve(csvFileContent)

export const internalAssignCertifiedAttributeMock = (_tenantOrigin: string, _tenantExternalId: string, _attributeOrigin: string, _attributeExternalId: string, _context: InteropContext): Promise<void> => Promise.resolve()
export const internalRevokeCertifiedAttributeMock = (_tenantOrigin: string, _tenantExternalId: string, _attributeOrigin: string, _attributeExternalId: string, _context: InteropContext): Promise<void> => Promise.resolve()

export const getPATenantsMock = (ipaCodes: string[]): Promise<PersistentTenant[]> => Promise.resolve(ipaCodes.map(c => ({ ...persistentTenant, externalId: { origin: 'tenantOrigin', value: c } })))
export const getNonPATenantsMock = (taxCodes: string[]): Promise<PersistentTenant[]> => Promise.resolve(taxCodes.map(c => ({ ...persistentTenant, externalId: { origin: 'tenantOrigin', value: c } })))
export const getTenantByIdMock = (tenantId: string): Promise<PersistentTenant> => Promise.resolve({ ...persistentTenant, id: tenantId })
export const getAttributeByExternalIdMock = (origin: string, code: string): Promise<PersistentAttribute> => Promise.resolve({ ...persistentAttribute, origin, code })

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