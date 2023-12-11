import { TenantAttribute } from '@interop-be-reports/commons'
import { IVASS_INSURANCES_ATTRIBUTE_CODE } from '../../config/constants.js'
import { PersistentAttribute } from '../../model/attribute.model.js'
import { InteropContext } from '../../model/interop-context.model.js'
import { PersistentTenant } from '../../model/tenant.model.js'

const csvFileContent = `OTHER_FIELD;CODICE_IVASS;DATA_ISCRIZIONE_ALBO_ELENCO;DATA_CANCELLAZIONE_ALBO_ELENCO;DENOMINAZIONE_IMPRESA;CODICE_FISCALE
F1;D0001;2020-12-02;9999-12-31;Org1;0000012345678901
F2;D0002;2020-06-10;9999-12-31;Org2;0000012345678902
F3;D0003;2019-07-19;9999-12-31;Org3;0000012345678903`

export const ATTRIBUTE_IVASS_INSURANCES_ID = 'b1d64ee0-fda9-48e2-84f8-1b62f1292b47'

export const downloadCSVMockGenerator = (csvContent: string) => vi.fn().mockImplementation((): Promise<string> => Promise.resolve(csvContent))
export const getTenantsMockGenerator =
  (f: (codes: string[]) => PersistentTenant[]) =>
  (codes: string[]): Promise<PersistentTenant[]> =>
    Promise.resolve(f(codes))
export const getTenantByIdMockGenerator =
  (f: (tenantId: string) => PersistentTenant) =>
  (tenantId: string): Promise<PersistentTenant> =>
    Promise.resolve(f(tenantId))

export const downloadCSVMock = downloadCSVMockGenerator(csvFileContent)

export const internalAssignCertifiedAttributeMock = (
  _tenantOrigin: string,
  _tenantExternalId: string,
  _attributeOrigin: string,
  _attributeExternalId: string,
  _context: InteropContext
): Promise<void> => Promise.resolve()
export const internalRevokeCertifiedAttributeMock = (
  _tenantOrigin: string,
  _tenantExternalId: string,
  _attributeOrigin: string,
  _attributeExternalId: string,
  _context: InteropContext
): Promise<void> => Promise.resolve()

export const getIVASSTenantsMock = getTenantsMockGenerator((taxCodes) =>
  taxCodes.map((c) => ({ ...persistentTenant, externalId: { origin: 'tenantOrigin', value: c } }))
)
export const getTenantsWithAttributesMock = (_: string[]) => Promise.resolve([])
export const getTenantByIdMock = getTenantByIdMockGenerator((tenantId) => ({
  ...persistentTenant,
  id: tenantId,
  features: [{ type: 'PersistentCertifier', certifierId: 'IVASS' }],
}))
export const getAttributeByExternalIdMock = (origin: string, code: string): Promise<PersistentAttribute> => {
  switch (code) {
    case IVASS_INSURANCES_ATTRIBUTE_CODE:
      return Promise.resolve({ ...persistentAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID, origin, code })
    default:
      return Promise.reject(new Error('Unexpected attribute code'))
  }
}

export const persistentTenant: PersistentTenant = {
  id: '091fbea1-0c8e-411b-988f-5098b6a33ba7',
  externalId: { origin: 'tenantOrigin', value: 'tenantValue' },
  attributes: [],
  features: [],
}

export const persistentAttribute: PersistentAttribute = {
  id: '7a04c906-1525-4c68-8a5b-d740d77d9c80',
  origin: 'attributeOrigin',
  code: 'attributeCode',
}

export const persistentTenantAttribute: TenantAttribute = {
  id: '7a04c906-1525-4c68-8a5b-d740d77d9c80',
  type: 'PersistentCertifiedAttribute',
  assignmentTimestamp: new Date(),
}
