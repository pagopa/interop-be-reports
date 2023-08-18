import { KafkaMessage } from "kafkajs";
import { EventPayload } from "../model/InstitutionEvent.js";
import { InteropTokenGenerator } from "@interop-be-reports/commons";
import { TenantProcessService } from "./tenantProcessService.js";
import { InteropContext } from "../model/InteropContext.js";
import { v4 as uuidv4 } from "uuid";

export const processMessage = (tokenGenerator: InteropTokenGenerator, tenantProcess: TenantProcessService, productName: string) => async (message: KafkaMessage, partition: number): Promise<void> => {
  if (!message.value)
    // TODO Should this throw an error or log warning and ignore?
    // throw Error(`Empty content for message with offset ${message.offset}`);
    return

  const stringPayload = message.value.toString()
  const jsonPayload = JSON.parse(stringPayload);

  // Process only messages of our product
  // Note: Filtered before parsing to avoid errors on an unexpected messages that we are not interested in 
  if (jsonPayload.product !== productName)
    // TODO Log debug?
    return

  const parsed = EventPayload.safeParse(jsonPayload);
  if (parsed.success) {
    // TODO Generate token only once and refresh it when needed
    //  Note: this function runs sequentially for each partition but in "parallel" among different partitions

    const token = await tokenGenerator.generateInternalToken()
    const context: InteropContext = { bearerToken: token.serialized, correlationId: uuidv4() }
    await tenantProcess.selfcareUpsertTenant(context)

    console.log(`Message in partition ${partition} with offset ${message.offset} correctly received`);
  } else {
    console.log(`Error consuming message in partition ${partition} with offset ${message.offset}. Reason: ${parsed.error}. Message: ${stringPayload}`)
    throw parsed.error;
  }
}
