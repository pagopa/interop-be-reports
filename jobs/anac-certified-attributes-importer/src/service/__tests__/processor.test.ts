import {
  InteropTokenGenerator,
  ReadModelClient,
  RefreshableInteropToken,
  generateInternalTokenMock,
} from '@interop-be-reports/commons'
import { ReadModelQueries, SftpClient, TenantProcessService, importAttributes } from '../index.js'
import {
  ATTRIBUTE_ANAC_ABILITATO_ID,
  ATTRIBUTE_ANAC_INCARICATO_ID,
  ATTRIBUTE_ANAC_IN_CONVALIDA_ID,
  archiveAgreementMock,
  downloadCSVMock,
  downloadCSVMockGenerator,
  getArchivableAgreementsMock,
  getAttributeByExternalIdMock,
  getNonPATenantsMock,
  getPATenantsMock,
  getTenantByIdMock,
  getTenantByIdMockGenerator,
  getTenantsMockGenerator,
  getTenantsWithAttributesMock,
  internalAssignCertifiedAttributeMock,
  internalRevokeCertifiedAttributeMock,
  persistentTenant,
  persistentTenantAttribute,
  sftpConfigTest,
} from './helpers.js'
import { PersistentTenant } from '../../model/tenant.model.js'
import { AgreementProcessService } from '../agreement-process.service.js'

describe('ANAC Certified Attributes Importer', () => {
  const tokenGeneratorMock = {} as InteropTokenGenerator
  const refreshableTokenMock = new RefreshableInteropToken(tokenGeneratorMock)
  const agreementProcessMock = new AgreementProcessService('url')
  const tenantProcessMock = new TenantProcessService('url')
  const sftpClientMock = new SftpClient(sftpConfigTest)
  const readModelClient = {} as ReadModelClient
  const readModelQueriesMock = new ReadModelQueries(readModelClient)

  const run = () =>
    importAttributes(
      sftpClientMock,
      readModelQueriesMock,
      agreementProcessMock,
      tenantProcessMock,
      refreshableTokenMock,
      10,
      'anac-tenant-id'
    )

  const loggerMock = vitest.fn()

  const refreshableInternalTokenSpy = vi
    .spyOn(refreshableTokenMock, 'get')
    .mockImplementation(generateInternalTokenMock)

  const internalAssignCertifiedAttributeSpy = vi
    .spyOn(tenantProcessMock, 'internalAssignCertifiedAttribute')
    .mockImplementation(internalAssignCertifiedAttributeMock)
  const internalRevokeCertifiedAttributeSpy = vi
    .spyOn(tenantProcessMock, 'internalRevokeCertifiedAttribute')
    .mockImplementation(internalRevokeCertifiedAttributeMock)
  const archiveAgreementSpy = vi
    .spyOn(agreementProcessMock, 'archiveAgreement')
    .mockImplementation(archiveAgreementMock)

  const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)
  const getNonPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getNonPATenants').mockImplementation(getNonPATenantsMock)
  const getTenantByIdSpy = vi.spyOn(readModelQueriesMock, 'getTenantById').mockImplementation(getTenantByIdMock)
  const getAttributeByExternalIdSpy = vi
    .spyOn(readModelQueriesMock, 'getAttributeByExternalId')
    .mockImplementation(getAttributeByExternalIdMock)
  const getTenantsWithAttributesSpy = vi
    .spyOn(readModelQueriesMock, 'getTenantsWithAttributes')
    .mockImplementation(getTenantsWithAttributesMock)
  const getArchivableAgreementsSpy = vi
    .spyOn(readModelQueriesMock, 'getArchivableAgreements')
    .mockImplementation(getArchivableAgreementsMock)

  beforeAll(() => {
    vitest.spyOn(console, 'log').mockImplementation(loggerMock)
    vitest.spyOn(console, 'error').mockImplementation(loggerMock)
    vitest.clearAllMocks()
  })

  afterEach(() => {
    vitest.clearAllMocks()
  })

  it('should succeed', async () => {
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(downloadCSVMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(1)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalled()
    expect(internalAssignCertifiedAttributeSpy).toBeCalled()
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should succeed, assigning only missing attributes', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_123' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should succeed, unassigning only existing attributes', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,FALSE,FALSE,FALSE`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_123' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID },
        ],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(2)
  })

  it('should succeed, only for tenants that exist on read model ', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE
9876543210,Org name not in Tenants,gsp2@pec.it,ipa_code_456,TRUE,TRUE,TRUE`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_123' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should succeed with more than one batch', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE
9876543210,Org name not in Tenants,gsp2@pec.it,ipa_code_456,TRUE,TRUE,TRUE
9876543299,Org name not in Tenants,gsp3@pec.it,ipa_code_789,TRUE,TRUE,TRUE`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_123' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsSpy = vi
      .spyOn(readModelQueriesMock, 'getPATenants')
      .mockImplementationOnce(getTenantsMockGenerator((_) => readModelTenants))
      .mockImplementation(getTenantsMockGenerator((_) => []))

    await importAttributes(
      sftpClientMock,
      readModelQueriesMock,
      agreementProcessMock,
      tenantProcessMock,
      refreshableTokenMock,
      1,
      'anac-tenant-id'
    )

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(3)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })


  it('should succeed, unassign attributes and archiving agreements for tenants not in the file', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
0123456781,Org name in IPA,gsp1@pec.it,ipa_code_1,TRUE,TRUE,TRUE`

    const readModelTenants: PersistentTenant[] = [
      {
        // Tenant with attributes that should be kept
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_1' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_IN_CONVALIDA_ID },
        ],
      },
      {
        // IPA Tenant with ANAC_ABILITATO attribute that should be removed
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_2' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID },
        ],
      },
      {
        // IPA Tenant with ANAC_INCARICATO attribute that should be removed
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_3' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID },
        ],
      },
      {
        // IPA Tenant with ANAC_IN_CONVALIDA attribute that should be removed
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_4' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_IN_CONVALIDA_ID },
        ],
      },
      {
        // IPA Tenant with multiple attributes that should be removed
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_5' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_IN_CONVALIDA_ID },
        ],
      },
      {
        // Private Tenant with multiple attributes that should be removed
        ...persistentTenant,
        externalId: { origin: 'ANAC', value: '0123456786' },
        attributes: [
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_INCARICATO_ID },
          { ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_IN_CONVALIDA_ID },
        ],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)

    const getTenantsWithAttributesMock = getTenantsMockGenerator((_) => readModelTenants)
    const getTenantsWithAttributesSpy = vi.spyOn(readModelQueriesMock, 'getTenantsWithAttributes').mockImplementationOnce(getTenantsWithAttributesMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)
    expect(getArchivableAgreementsSpy).toBeCalledTimes(5)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(14)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(9)
    expect(archiveAgreementSpy).toBeCalledTimes(10)
  })

  it('should fail on CSV retrieve error', async () => {
    const localDownloadCSVMock = (): Promise<string> => Promise.reject(new Error('CSV Retrieve error'))
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    await expect(() => run()).rejects.toThrowError('CSV Retrieve error')

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(0)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(0)

    expect(getPATenantsSpy).toBeCalledTimes(0)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(0)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(0)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should fail if the tenant is not configured as certifier', async () => {
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(downloadCSVMock)

    const getTenantByIdMock = getTenantByIdMockGenerator((tenantId) => ({
      ...persistentTenant,
      id: tenantId,
      features: [],
    }))
    getTenantByIdSpy.mockImplementationOnce(getTenantByIdMock)

    await expect(() => run()).rejects.toThrowError('Tenant with id anac-tenant-id is not a certifier')

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(0)

    expect(getPATenantsSpy).toBeCalledTimes(0)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(0)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(0)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should skip CSV file rows with unexpected schema', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
    ,Wrong format row,gsp1@pec.it,ipa_code_123,TRUE,TRUE,
    ,Wrong "quotes" row,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE
    0123456789,"Org name, in IPA",gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IPA', value: 'ipa_code_123' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const getPATenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)

    await run()

    expect(downloadCSVSpy).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(3)

    expect(getPATenantsSpy).toBeCalledTimes(1)
    expect(getNonPATenantsSpy).toBeCalledTimes(0)
    expect(getTenantsWithAttributesSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })
})
