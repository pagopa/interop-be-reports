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
  downloadCSVMock,
  downloadCSVMockGenerator,
  getAttributeByExternalIdMock,
  getNonPATenantsMock,
  getPATenantsMock,
  getTenantByIdMock,
  getTenantByIdMockGenerator,
  getTenantsMockGenerator,
  internalAssignCertifiedAttributeMock,
  internalRevokeCertifiedAttributeMock,
  persistentTenant,
  persistentTenantAttribute,
  sftpConfigTest,
} from './helpers.js'
import { PersistentTenant } from '../../model/tenant.model.js'

describe('ANAC Certified Attributes Importer', () => {
  const tokenGeneratorMock = {} as InteropTokenGenerator
  const refreshableTokenMock = new RefreshableInteropToken(tokenGeneratorMock)
  const tenantProcessMock = new TenantProcessService('url')
  const sftpClientMock = new SftpClient(sftpConfigTest)
  const readModelClient = {} as ReadModelClient
  const readModelQueriesMock = new ReadModelQueries(readModelClient)

  const run = () =>
    importAttributes(
      sftpClientMock,
      readModelQueriesMock,
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

  const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)
  const getNonPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getNonPATenants').mockImplementation(getNonPATenantsMock)
  const getTenantByIdSpy = vi.spyOn(readModelQueriesMock, 'getTenantById').mockImplementation(getTenantByIdMock)
  const getAttributeByExternalIdSpy = vi
    .spyOn(readModelQueriesMock, 'getAttributeByExternalId')
    .mockImplementation(getAttributeByExternalIdMock)

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

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
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

    expect(refreshableInternalTokenSpy).toBeCalledTimes(0)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should skip CSV file rows with unexpected schema', async () => {
    const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,ANAC_incaricato,ANAC_abilitato,ANAC_in_convalida
    ,Wrong format row,gsp1@pec.it,ipa_code_123,TRUE,TRUE,
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

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })
})
