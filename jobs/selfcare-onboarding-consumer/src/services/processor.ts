import { KafkaMessage } from "kafkajs";
import { EventPayload } from "../model/institution-event.js";
import { RefreshableInteropToken, ORIGIN_IPA } from "@interop-be-reports/commons";
import { TenantProcessService } from "./tenantProcessService.js";
import { InteropContext } from "../model/interop-context.js";
import { SelfcareTenantSeed } from "../model/tenant-process.js";
import { error, info, warn } from "../utils/logger.js";
import crypto from "crypto"

export const processMessage = (refreshableToken: RefreshableInteropToken, tenantProcess: TenantProcessService, productName: string) => async (message: KafkaMessage, partition: number): Promise<void> => {
  const correlationId = crypto.randomUUID()

  try {

    info(correlationId, `Consuming message for partition ${partition} with offset ${message.offset}`)

    if (!message.value) {
      warn(correlationId, `Empty message for partition ${partition} with offset ${message.offset}`)
      return
    }

    const stringPayload = message.value.toString()
    const jsonPayload = JSON.parse(stringPayload);

    // Process only messages of our product
    // Note: Filtered before parsing to avoid errors on an unexpected messages that we are not interested in 
    if (jsonPayload.product !== productName) {
      info(correlationId, `Skipping message for partition ${partition} with offset ${message.offset} - Not required product: ${jsonPayload.product}`)
      return
    }

    const parsed = EventPayload.safeParse(jsonPayload);

    if (parsed.success) {
      const token = await refreshableToken.get()
      const context: InteropContext = { bearerToken: token.serialized, correlationId }

      const institution = parsed.data.institution

      const seed: SelfcareTenantSeed = {
        externalId: {
          origin: institution.origin,
          value: institution.origin == ORIGIN_IPA ? institution.subUnitCode || institution.originId : institution.taxCode
        },
        selfcareId: parsed.data.internalIstitutionID,
        name: institution.description
      }
      await tenantProcess.selfcareUpsertTenant(seed, context)

      info(correlationId, `Message in partition ${partition} with offset ${message.offset} correctly consumed. SelfcareId: ${parsed.data.internalIstitutionID}`);
    } else {
      // Log to WARN to avoid double ERROR level message (and double alarm)
      warn(correlationId, `Error consuming message in partition ${partition} with offset ${message.offset}. Message: ${stringPayload}`)
      throw parsed.error;
    }
  } catch (err) {
    const errorMessage = `Error consuming message in partition ${partition} with offset ${message.offset}. Reason: ${err}`
    error(correlationId, errorMessage)
    throw new Error(errorMessage, { cause: err })
  }
}
