import { InteropTokenGenerator } from "@interop-be-reports/commons"
import { processMessage } from "../services/processor.js"
import { TenantProcessService } from "../services/tenantProcessService.js"
import { correctEventPayload, correctInstitutionEventField, generateInternalTokenMock, interopProductName, interopToken, kafkaMessage, selfcareUpsertTenantMock, tokenConfig } from "./helpers.js"


describe('processor', () => {

  const tokenGeneratorMock = new InteropTokenGenerator(tokenConfig)
  const tenantProcessMock = new TenantProcessService("url")

  const configuredProcessor = processMessage(tokenGeneratorMock, tenantProcessMock, interopProductName)

  const loggerMock = vitest.fn()
  const generateInternalTokenSpy = vi.spyOn(tokenGeneratorMock, 'generateInternalToken').mockImplementation(generateInternalTokenMock)
  const selfcareUpsertTenantSpy = vi.spyOn(tenantProcessMock, 'selfcareUpsertTenant').mockImplementation(selfcareUpsertTenantMock)

  beforeAll(() => {
    vitest.spyOn(console, 'log').mockImplementation(loggerMock)
  })

  afterEach(() => {
    vitest.clearAllMocks()
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

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)

  })

  it('should upsert PA tenant - Main institution', async () => {

    const message = { ...kafkaMessage, value: Buffer.from(JSON.stringify({ ...correctEventPayload, institution: { ...correctInstitutionEventField, origin: "IPA", originId: "ipa_123", subUnitType: null, subUnitCode: null } })) }

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toHaveBeenCalledWith(
      expect.objectContaining(
        {
          externalId: { origin: "IPA", value: "ipa_123" },
          selfcareId: correctEventPayload.internalIstitutionID,
          name: correctInstitutionEventField.description,
        }),
      expect.objectContaining({ bearerToken: interopToken.serialized })
    )

  })

  it('should upsert PA tenant - AOO/UO', async () => {

    const message = { ...kafkaMessage, value: Buffer.from(JSON.stringify({ ...correctEventPayload, institution: { ...correctInstitutionEventField, origin: "IPA", originId: "ipa_123", subUnitType: "AOO", subUnitCode: "AOO_456" } })) }

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toHaveBeenCalledWith(
      expect.objectContaining(
        {
          externalId: { origin: "IPA", value: "AOO_456" },
          selfcareId: correctEventPayload.internalIstitutionID,
          name: correctInstitutionEventField.description,
        }),
      expect.objectContaining({ bearerToken: interopToken.serialized })
    )

  })


  it('should upsert non-PA tenant', async () => {

    const message = { ...kafkaMessage, value: Buffer.from(JSON.stringify({ ...correctEventPayload, institution: { ...correctInstitutionEventField, origin: "OTHER", originId: "ipa_123", taxCode: "tax789", subUnitType: null, subUnitCode: null } })) }

    await configuredProcessor(message, 0)

    expect(generateInternalTokenSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toBeCalledTimes(1)
    expect(selfcareUpsertTenantSpy).toHaveBeenCalledWith(
      expect.objectContaining(
        {
          externalId: { origin: "OTHER", value: "tax789" },
          selfcareId: correctEventPayload.internalIstitutionID,
          name: correctInstitutionEventField.description,
        }),
      expect.objectContaining({ bearerToken: interopToken.serialized })
    )

  })
})