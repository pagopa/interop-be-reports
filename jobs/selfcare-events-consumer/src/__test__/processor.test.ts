import { InteropTokenGenerator } from "@interop-be-reports/commons"
import { processMessage } from "../services/processor.js"
import { TenantProcessService } from "../services/tenantProcessService.js"
import { correctEventPayload, generateInternalTokenMock, interopProductName, kafkaMessage, selfcareUpsertTenantMock, tokenConfig } from "./helpers.js"


describe('processor', () => {

  const tokenGeneratorMock = new InteropTokenGenerator(tokenConfig)
  const tenantProcessMock = new TenantProcessService("url")

  const configuredProcessor = processMessage(tokenGeneratorMock, tenantProcessMock, interopProductName)

  const loggerMock = vitest.fn()
  const generateInternalTokenSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken')
  const selfcareUpsertTenantSpy = vi.spyOn(tenantProcessMock, 'selfcareUpsertTenant')

  beforeAll(() => {
    vitest.spyOn(console, 'log').mockImplementation(loggerMock)
  })

  afterEach(() => {
    vitest.restoreAllMocks()
  })

  it('should skip empty message', async () => {

    const message = { ...kafkaMessage, value: null }

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(0)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(0)

  })

  it('should throw an error if message is malformed', async () => {

    const message = { ...kafkaMessage, value: Buffer.from('{ not-a : "correct-json"') }

    expect(() => configuredProcessor(message, 0)).rejects.toThrowError(/Error.*partition.*offset.*Reason/)

    expect(generateInternalTokenSpy).toBeCalledTimes(0)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(0)

  })

  it('should skip message not containing required product', async () => {

    const message = { ...kafkaMessage, value: Buffer.from(JSON.stringify({ ...correctEventPayload, product: 'another-product' })) }

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(0)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(0)

  })

  it('should throw an error if message has unexpected schema', async () => {

    const message = { ...kafkaMessage, value: Buffer.from(`{ "product" : "${interopProductName}", "this-schema" : "was-unexpected" }`) }

    expect(() => configuredProcessor(message, 0)).rejects.toThrowError(/Error.*partition.*offset.*Reason/)

    expect(generateInternalTokenSpy).toBeCalledTimes(0)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(0)

  })

  it('should upsert tenant on correct message', async () => {

    const message = kafkaMessage

    const generateInternalTokenSpy = vi.spyOn(tenantProcessMock, 'selfcareUpsertTenant').mockImplementationOnce(selfcareUpsertTenantMock)
    const selfcareUpsertTenantSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken').mockImplementationOnce(generateInternalTokenMock)

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)

  })

})