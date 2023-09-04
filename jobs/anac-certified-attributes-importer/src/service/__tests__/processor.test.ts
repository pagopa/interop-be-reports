import { InteropTokenGenerator, ReadModelClient, RefreshableInteropToken, generateInternalTokenMock } from "@interop-be-reports/commons"
import { ReadModelQueries, SftpClient, TenantProcessService, importAttributes } from "../index.js"
import { ATTRIBUTE_ANAC_ABILITATO_ID, ATTRIBUTE_ANAC_IN_CONVALIDA_ID, downloadCSVMock, getAttributeByExternalIdMock, getNonPATenantsMock, getPATenantsMock, getTenantByIdMock, internalAssignCertifiedAttributeMock, internalRevokeCertifiedAttributeMock, persistentAttribute, persistentTenant, persistentTenantAttribute, sftpConfigTest } from "./helpers.js"
import { PersistentTenant } from "../../model/tenant.model.js"


describe('ANAC Certified Attributes Importer', () => {

  const tokenGeneratorMock = {} as InteropTokenGenerator
  const refreshableTokenMock = new RefreshableInteropToken(tokenGeneratorMock)
  const tenantProcessMock = new TenantProcessService("url")
  const sftpClientMock = new SftpClient(sftpConfigTest)
  const readModelClient = {} as ReadModelClient
  const readModelQueriesMock = new ReadModelQueries(readModelClient, 'tenants', 'attributes')

  const run = () => importAttributes(sftpClientMock, readModelQueriesMock, tenantProcessMock, refreshableTokenMock, 1, 'anac-tenant-id')

  // const loggerMock = vitest.fn()

  const refreshableInternalTokenSpy = vi.spyOn(refreshableTokenMock, 'get').mockImplementation(generateInternalTokenMock)

  // const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(downloadCSVMock)

  const internalAssignCertifiedAttributeSpy = vi.spyOn(tenantProcessMock, 'internalAssignCertifiedAttribute').mockImplementation(internalAssignCertifiedAttributeMock)
  const internalRevokeCertifiedAttributeSpy = vi.spyOn(tenantProcessMock, 'internalRevokeCertifiedAttribute').mockImplementation(internalRevokeCertifiedAttributeMock)

  const getPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getPATenants').mockImplementation(getPATenantsMock)
  const getNonPATenantsSpy = vi.spyOn(readModelQueriesMock, 'getNonPATenants').mockImplementation(getNonPATenantsMock)
  const getTenantByIdSpy = vi.spyOn(readModelQueriesMock, 'getTenantById').mockImplementation(getTenantByIdMock)
  const getAttributeByExternalIdSpy = vi.spyOn(readModelQueriesMock, 'getAttributeByExternalId').mockImplementation(getAttributeByExternalIdMock)


  beforeAll(() => {
    // vitest.spyOn(console, 'log').mockImplementation(loggerMock)
    // vitest.spyOn(console, 'error').mockImplementation(loggerMock)
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
    expect(getNonPATenantsSpy).toBeCalledTimes(2)

    expect(refreshableInternalTokenSpy).toBeCalled()
    expect(internalAssignCertifiedAttributeSpy).toBeCalled()
    expect(internalRevokeCertifiedAttributeSpy).toBeCalledTimes(0)

  })

  it('should succeed, assigning only missing attributes', async () => {
    const csvFileContent =
      `cf_gestore,denominazione,domicilio_digitale,codice_ipa,anac_incaricato,anac_abilitato,anac_in_convalida
0123456789,Nome ente presente in IPA,gsp1@pec.it,DRMEST,TRUE,TRUE,TRUE`

    const localDownloadCSVMock = (): Promise<string> => Promise.resolve(csvFileContent)
    const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(localDownloadCSVMock)

    const readModelTenants: PersistentTenant[] = [{
      ...persistentTenant,
      externalId: { origin: 'IPA', value: 'DRMEST' },
      attributes: [{ ...persistentTenantAttribute, id: ATTRIBUTE_ANAC_ABILITATO_ID }]
    }]

    const getPATenantsMock = (_ipaCodes: string[]): Promise<PersistentTenant[]> => Promise.resolve(readModelTenants)
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

  it('should succeed, unassigning only existing attributes', async () => { })

  it('should succeed, only for tenants that exist on read model ', async () => { })

  it('should succeed with more than one batch', async () => { })

  it('should fail on CSV retrieve error', async () => { })

  it('should fail if the tenant is not configured as certifier', async () => { })

  it('should fail if one attribute does not exist', async () => { })

  it('should fail if the CSV has unexpected schema', async () => { })

})