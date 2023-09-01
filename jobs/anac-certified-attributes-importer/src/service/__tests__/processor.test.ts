import { InteropTokenGenerator, ReadModelClient, RefreshableInteropToken, generateInternalTokenMock } from "@interop-be-reports/commons"
import { ReadModelQueries, SftpClient, TenantProcessService, importAttributes } from "../index.js"
import { downloadCSVMock, getAttributeByExternalIdMock, getNonPATenantsMock, getPATenantsMock, getTenantByIdMock, internalAssignCertifiedAttributeMock, internalRevokeCertifiedAttributeMock, sftpConfigTest } from "./helpers.js"


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

  const downloadCSVSpy = vi.spyOn(sftpClientMock, 'downloadCSV').mockImplementation(downloadCSVMock)

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

  it('should succeed, assigning missing attributes', async () => { })

  it('should succeed, unassigning existing attributes', async () => { })

  it('should succeed, only for tenants that exist on read model ', async () => { })

  it('should succeed with more than one batch', async () => { })

  it('should succeed without assigning and unassigning attributes if not required', async () => { })

  it('should fail on CSV retrieve error', async () => { })

  it('should fail if the tenant is not configured as certifier', async () => { })

  it('should fail if one attribute does not exist', async () => { })

  it('should fail if the CSV has unexpected schema', async () => { })

})