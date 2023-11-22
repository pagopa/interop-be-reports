import {
  InteropTokenGenerator,
  ReadModelClient,
  RefreshableInteropToken,
  generateInternalTokenMock,
} from '@interop-be-reports/commons'

import { ReadModelQueries } from "../read-model-queries.service.js";
import { TenantProcessService } from "../tenant-process.service.js";
import { importAttributes } from "../processor.js";

import {
  ATTRIBUTE_IVASS_INSURANCES_ID,
  downloadCSVMock,
  downloadCSVMockGenerator,
  getAttributeByExternalIdMock,
  getIVASSTenantsMock,
  getTenantByIdMock,
  // getTenantByIdMockGenerator,
  getTenantsMockGenerator,
  internalAssignCertifiedAttributeMock,
  internalRevokeCertifiedAttributeMock,
  persistentTenant,
  persistentTenantAttribute,
} from './helpers.js'
import { PersistentTenant } from '../../model/tenant.model.js'

describe('IVASS Certified Attributes Importer', () => {
  const tokenGeneratorMock = {} as InteropTokenGenerator
  const refreshableTokenMock = new RefreshableInteropToken(tokenGeneratorMock)
  const tenantProcessMock = new TenantProcessService('url')
  const csvDownloaderMock = downloadCSVMock
  const readModelClient = {} as ReadModelClient
  const readModelQueriesMock = new ReadModelQueries(readModelClient)

  const run = () =>
    importAttributes(
      csvDownloaderMock,
      readModelQueriesMock,
      tenantProcessMock,
      refreshableTokenMock,
      10,
      'ivass-tenant-id'
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

  const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)
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
    await run()

    expect(downloadCSVMock).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

    expect(getIVASSTenantsSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalled()
    expect(internalAssignCertifiedAttributeSpy).toBeCalled()
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should succeed, assigning only missing attributes', async () => {
    const csvFileContent = `CODICE_IVASS;DATA_ISCRIZIONE_ALBO_ELENCO;DATA_CANCELLAZIONE_ALBO_ELENCO;DENOMINAZIONE_IMPRESA;CODICE_FISCALE
    D0001;2020-12-02;9999-12-31;Org1;0000012345678901
    D0002;2020-06-10;9999-12-31;Org2;0000012345678902
    D0003;2019-07-19;9999-12-31;Org3;0000012345678903`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678901' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID }],
      },
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678902' },
        attributes: [{ ...persistentTenantAttribute }],
      },
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678903' },
        attributes: [],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)

    const getIVASSTenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)

    await importAttributes(
      localDownloadCSVMock,
      readModelQueriesMock,
      tenantProcessMock,
      refreshableTokenMock,
      10,
      'ivass-tenant-id'
    )

    expect(localDownloadCSVMock).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

    expect(getIVASSTenantsSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  })

  it('should succeed, unassigning expired organizations ', async () => {
    const csvFileContent = `CODICE_IVASS;DATA_ISCRIZIONE_ALBO_ELENCO;DATA_CANCELLAZIONE_ALBO_ELENCO;DENOMINAZIONE_IMPRESA;CODICE_FISCALE
    D0001;2020-12-02;2021-12-31;Org1;0000012345678901
    D0002;2100-06-10;9999-12-31;Org2;0000012345678902
    D0003;2000-06-10;9999-12-31;Org3;0000012345678903`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678901' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID }],
      },
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678902' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID }],
      },
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678903' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)

    const getIVASSTenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)

    await importAttributes(
      localDownloadCSVMock,
      readModelQueriesMock,
      tenantProcessMock,
      refreshableTokenMock,
      10,
      'ivass-tenant-id'
    )

    expect(localDownloadCSVMock).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

    expect(getIVASSTenantsSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(2)
  })

  it('should succeed, unassigning only existing attributes', async () => {
    const csvFileContent = `CODICE_IVASS;DATA_ISCRIZIONE_ALBO_ELENCO;DATA_CANCELLAZIONE_ALBO_ELENCO;DENOMINAZIONE_IMPRESA;CODICE_FISCALE
    D0001;2020-12-02;2021-12-31;Org1;0000012345678901
    D0002;2020-06-10;2021-12-31;Org2;0000012345678902
    D0003;2019-07-19;9999-12-31;Org3;0000012345678903`

    const readModelTenants: PersistentTenant[] = [
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678901' },
        attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_INSURANCES_ID }],
      },
      {
        ...persistentTenant,
        externalId: { origin: 'IVASS', value: '12345678902' },
        attributes: [{ ...persistentTenantAttribute }],
      },
    ]

    const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)

    const getIVASSTenantsMock = getTenantsMockGenerator((_) => readModelTenants)
    const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)

    await importAttributes(
      localDownloadCSVMock,
      readModelQueriesMock,
      tenantProcessMock,
      refreshableTokenMock,
      10,
      'ivass-tenant-id'
    )

    expect(localDownloadCSVMock).toBeCalledTimes(1)
    expect(getTenantByIdSpy).toBeCalledTimes(1)
    expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

    expect(getIVASSTenantsSpy).toBeCalledTimes(1)

    expect(refreshableInternalTokenSpy).toBeCalledTimes(1)
    expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(1)
  })

  //   it('should succeed, only for tenants that exist on read model ', async () => {
  //     const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,IVASS_incaricato,IVASS_abilitato,IVASS_in_convalida
  // 0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE
  // 9876543210,Org name not in Tenants,gsp2@pec.it,ipa_code_456,TRUE,TRUE,TRUE`

  //     const readModelTenants: PersistentTenant[] = [
  //       {
  //         ...persistentTenant,
  //         externalId: { origin: 'IVASS', value: 'ipa_code_123' },
  //         attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_ABILITATO_ID }],
  //       },
  //     ]

  //     const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
  //     const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

  //     const getIVASSTenantsMock = getTenantsMockGenerator((_) => readModelTenants)
  //     const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)

  //     await run()

  //     expect(downloadCSVSpy).toBeCalledTimes(1)
  //     expect(getTenantByIdSpy).toBeCalledTimes(1)
  //     expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

  //     expect(getIVASSTenantsSpy).toBeCalledTimes(1)
  //     expect(getNonIVASSTenantsSpy).toBeCalledTimes(0)

  //     expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
  //     expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
  //     expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  //   })

  //   it('should succeed with more than one batch', async () => {
  //     const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,IVASS_incaricato,IVASS_abilitato,IVASS_in_convalida
  // 0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE
  // 9876543210,Org name not in Tenants,gsp2@pec.it,ipa_code_456,TRUE,TRUE,TRUE
  // 9876543299,Org name not in Tenants,gsp3@pec.it,ipa_code_789,TRUE,TRUE,TRUE`

  //     const readModelTenants: PersistentTenant[] = [
  //       {
  //         ...persistentTenant,
  //         externalId: { origin: 'IVASS', value: 'ipa_code_123' },
  //         attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_ABILITATO_ID }],
  //       },
  //     ]

  //     const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
  //     const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

  //     const getIVASSTenantsSpy = vi
  //       .spyOn(readModelQueriesMock, 'getIVASSTenants')
  //       .mockImplementationOnce(getTenantsMockGenerator((_) => readModelTenants))
  //       .mockImplementation(getTenantsMockGenerator((_) => []))

  //     await importAttributes(
  //       sftpClientMock,
  //       readModelQueriesMock,
  //       tenantProcessMock,
  //       refreshableTokenMock,
  //       1,
  //       'ivass-tenant-id'
  //     )

  //     expect(downloadCSVSpy).toBeCalledTimes(1)
  //     expect(getTenantByIdSpy).toBeCalledTimes(1)
  //     expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

  //     expect(getIVASSTenantsSpy).toBeCalledTimes(3)
  //     expect(getNonIVASSTenantsSpy).toBeCalledTimes(0)

  //     expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
  //     expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
  //     expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  //   })

  //   it('should fail on CSV retrieve error', async () => {
  //     const localDownloadCSVMock = (): Promise<string> => Promise.reject(new Error('CSV Retrieve error'))
  //     const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

  //     await expect(() => run()).rejects.toThrowError('CSV Retrieve error')

  //     expect(downloadCSVSpy).toBeCalledTimes(1)
  //     expect(getTenantByIdSpy).toBeCalledTimes(0)
  //     expect(getAttributeByExternalIdSpy).toBeCalledTimes(0)

  //     expect(getIVASSTenantsSpy).toBeCalledTimes(0)
  //     expect(getNonIVASSTenantsSpy).toBeCalledTimes(0)

  //     expect(refreshableInternalTokenSpy).toBeCalledTimes(0)
  //     expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
  //     expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  //   })

  //   it('should fail if the tenant is not configured as certifier', async () => {
  //     const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(downloadCSVMock)

  //     const getTenantByIdMock = getTenantByIdMockGenerator((tenantId) => ({
  //       ...persistentTenant,
  //       id: tenantId,
  //       features: [],
  //     }))
  //     getTenantByIdSpy.mockImplementationOnce(getTenantByIdMock)

  //     await expect(() => run()).rejects.toThrowError('Tenant with id ivass-tenant-id is not a certifier')

  //     expect(downloadCSVSpy).toBeCalledTimes(1)
  //     expect(getTenantByIdSpy).toBeCalledTimes(1)
  //     expect(getAttributeByExternalIdSpy).toBeCalledTimes(0)

  //     expect(getIVASSTenantsSpy).toBeCalledTimes(0)
  //     expect(getNonIVASSTenantsSpy).toBeCalledTimes(0)

  //     expect(refreshableInternalTokenSpy).toBeCalledTimes(0)
  //     expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(0)
  //     expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  //   })

  //   it('should skip CSV file rows with unexpected schema', async () => {
  //     const csvFileContent = `codiceFiscaleGestore,denominazioneGestore,PEC,codiceIPA,IVASS_incaricato,IVASS_abilitato,IVASS_in_convalida
  //     ,Wrong format row,gsp1@pec.it,ipa_code_123,TRUE,TRUE,
  //     0123456789,Org name in IPA,gsp1@pec.it,ipa_code_123,TRUE,TRUE,TRUE`

  //     const readModelTenants: PersistentTenant[] = [
  //       {
  //         ...persistentTenant,
  //         externalId: { origin: 'IVASS', value: 'ipa_code_123' },
  //         attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_IVASS_ABILITATO_ID }],
  //       },
  //     ]

  //     const localDownloadCSVMock = downloadCSVMockGenerator(csvFileContent)
  //     const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

  //     const getIVASSTenantsMock = getTenantsMockGenerator((_) => readModelTenants)
  //     const getIVASSTenantsSpy = vi.spyOn(readModelQueriesMock, 'getIVASSTenants').mockImplementation(getIVASSTenantsMock)

  //     await run()

  //     expect(downloadCSVSpy).toBeCalledTimes(1)
  //     expect(getTenantByIdSpy).toBeCalledTimes(1)
  //     expect(getAttributeByExternalIdSpy).toBeCalledTimes(1)

  //     expect(getIVASSTenantsSpy).toBeCalledTimes(1)
  //     expect(getNonIVASSTenantsSpy).toBeCalledTimes(0)

  //     expect(refreshableInternalTokenSpy).toBeCalledTimes(2)
  //     expect(internalAssignCertifiedAttributeSpy).toBeCalledTimes(2)
  //     expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)
  //   })

  // it('should skip CSV file rows with missing Tax Code', async () => {})
})
