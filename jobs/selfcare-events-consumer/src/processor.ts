import { KafkaMessage } from "kafkajs";
import { EventPayload } from "./model/InstitutionEvent.js";


export const processMessage = (productName: string) => async (message: KafkaMessage): Promise<void> => {
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
    console.log(`Message with offset ${message.offset} correctly received`);
  } else {
    console.log(`Error consuming message with offset ${message.offset}. Reason: ${parsed.error}. Message: ${stringPayload}`)
    throw parsed.error;
  }
}

