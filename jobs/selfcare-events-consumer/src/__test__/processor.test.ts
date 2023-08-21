import { InteropTokenGenerator } from "@interop-be-reports/commons"
import { processMessage } from "../services/processor.js"
import { TenantProcessService } from "../services/tenantProcessService.js"
import { generateInternalTokenMock, interopProductName, kafkaMessage, selfcareUpsertTenantMock, tokenConfig } from "./helpers.js"


describe('processor', () => {

  const tokenGeneratorMock = new InteropTokenGenerator(tokenConfig)
  const tenantProcessMock = new TenantProcessService("url")

  const configuredProcessor = processMessage(tokenGeneratorMock, tenantProcessMock, interopProductName)

  afterEach(() => {
    vitest.restoreAllMocks()
  })

  it('should skip empty messages', async () => {

    const message = { ...kafkaMessage, value: null }

    const generateInternalTokenSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken')
    const selfcareUpsertTenantSpy = vi.spyOn(tenantProcessMock, 'selfcareUpsertTenant')

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(0)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(0)

  })

  it('should upsert tenant on correct message', async () => {

    const message = kafkaMessage

    const generateInternalTokenSpy = vi.spyOn(tenantProcessMock, 'selfcareUpsertTenant').mockImplementation(selfcareUpsertTenantMock)
    const selfcareUpsertTenantSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken').mockImplementation(generateInternalTokenMock)

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)

  })

})