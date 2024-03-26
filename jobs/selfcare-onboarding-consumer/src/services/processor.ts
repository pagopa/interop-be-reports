import { KafkaMessage } from "kafkajs";
import { EventPayload } from "../model/institution-event.js";
import { RefreshableInteropToken, ORIGIN_IPA, logInfo, logWarn, logError } from "@interop-be-reports/commons";
import { TenantProcessService } from "./tenantProcessService.js";
import { InteropContext } from "../model/interop-context.js";
import { MailKind, SelfcareTenantSeed } from "../model/tenant-process.js";
import crypto from "crypto"

export const processMessage = (refreshableToken: RefreshableInteropToken, tenantProcess: TenantProcessService, productName: string, allowedOrigins: string[]) => async (message: KafkaMessage, partition: number): Promise<void> => {
  const correlationId = crypto.randomUUID()

  try {

    logInfo(correlationId, `Consuming message for partition ${partition} with offset ${message.offset}`)

    if (!message.value) {
      logWarn(correlationId, `Empty message for partition ${partition} with offset ${message.offset}`)
      return
    }

    const stringPayload = message.value.toString()
    const jsonPayload = JSON.parse(stringPayload);

    // Process only messages of our product
    // Note: Filtered before parsing to avoid errors on an unexpected messages that we are not interested in 
    if (jsonPayload.product !== productName) {
      logInfo(correlationId, `Skipping message for partition ${partition} with offset ${message.offset} - Not required product: ${jsonPayload.product}`)
      return
    }

    const parsed = EventPayload.safeParse(jsonPayload);

    if (parsed.success) {

      const institution = parsed.data.institution

      if (allowedOrigins.indexOf(institution.origin) < 0) {
        logWarn(correlationId, `Skipping message for partition ${partition} with offset ${message.offset} - Not allowed origin. SelfcareId: ${parsed.data.internalIstitutionID} Origin: ${institution.origin} OriginId: ${institution.originId}`)
        return
      }

      const token = await refreshableToken.get()
      const context: InteropContext = { bearerToken: token.serialized, correlationId }

      const externalIdValue = institution.origin == ORIGIN_IPA ? (institution.subUnitCode || institution.originId) : (institution.taxCode || institution.originId)

      const seed: SelfcareTenantSeed = {
        externalId: {
          origin: institution.origin,
          value: externalIdValue
        },
        selfcareId: parsed.data.internalIstitutionID,
        name: institution.description,
        onboardedAt: parsed.data.createdAt,
        digitalAddress: {
          kind: MailKind.Values.DIGITAL_ADDRESS,
          description: "Domicilio digitale",
          address: institution.digitalAddress,
        },
        subUnitType: institution.subUnitType || undefined,
      }
      await tenantProcess.selfcareUpsertTenant(seed, context)

      logInfo(correlationId, `Message in partition ${partition} with offset ${message.offset} correctly consumed. SelfcareId: ${parsed.data.internalIstitutionID} Origin: ${institution.origin} OriginId: ${institution.originId}`);
    } else {
      // Log to WARN to avoid double ERROR level message (and double alarm)
      logWarn(correlationId, `Error consuming message in partition ${partition} with offset ${message.offset}. Message: ${stringPayload}`)
      throw parsed.error;
    }
  } catch (err) {
    const errorMessage = `Error consuming message in partition ${partition} with offset ${message.offset}. Reason: ${err}`
    logError(correlationId, errorMessage)
    throw new Error(errorMessage, { cause: err })
  }
}
