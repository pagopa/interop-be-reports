import { KafkaMessage } from "kafkajs";
import { EventPayload } from "../model/institution-event.js";
import { InteropTokenGenerator, ORIGIN_IPA } from "@interop-be-reports/commons";
import { TenantProcessService } from "./tenantProcessService.js";
import { InteropContext } from "../model/interop-context.js";
import { v4 as uuidv4 } from "uuid";
import { SelfcareTenantSeed } from "../model/tenant-process.js";

export const processMessage = (tokenGenerator: InteropTokenGenerator, tenantProcess: TenantProcessService, productName: string) => async (message: KafkaMessage, partition: number): Promise<void> => {
  try {

    console.log(`Consuming message for partition ${partition} with offset ${message.offset}`)

    if (!message.value) {
      // TODO Should this throw an error or log warning and ignore?
      console.log(`WARN: Empty message for partition ${partition} with offset ${message.offset}`)
      return
    }

    const stringPayload = message.value.toString()
    const jsonPayload = JSON.parse(stringPayload);

    // Process only messages of our product
    // Note: Filtered before parsing to avoid errors on an unexpected messages that we are not interested in 
    if (jsonPayload.product !== productName) {
      // TODO Log debug?
      console.log(`Skipping message for partition ${partition} with offset ${message.offset} - Not required product: ${jsonPayload.product}`)
      return
    }

    const parsed = EventPayload.safeParse(jsonPayload);

    if (parsed.success) {
      // TODO Generate token only once and refresh it when needed
      //  Note: this function runs sequentially for each partition but in "parallel" among different partitions

      const token = await tokenGenerator.generateInternalToken()
      const context: InteropContext = { bearerToken: token.serialized, correlationId: uuidv4() }

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

      console.log(`Message in partition ${partition} with offset ${message.offset} correctly consumed`);
    } else {
      // TODO Log to INFO to avoid double ERROR level message (and double alarm)
      console.log(`Error consuming message in partition ${partition} with offset ${message.offset}. Message: ${stringPayload}`)
      throw parsed.error;
    }
  } catch (err) {
    const errorMessage = `Error consuming message in partition ${partition} with offset ${message.offset}. Reason: ${err}`
    console.log(errorMessage)
    throw new Error(errorMessage, { cause: err })
  }
}
