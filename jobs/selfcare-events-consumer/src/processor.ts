import { KafkaMessage } from "kafkajs";
import { EventPayload } from "./model/InstitutionEvent.js";


export async function processMessage(message: KafkaMessage): Promise<void> {
  if (message.value) {
    const stringPayload = message.value.toString()
    const jsonPayload = JSON.parse(stringPayload);
    const parsed = EventPayload.safeParse(jsonPayload);
    if (parsed.success) {
      // TODO Filter by product
      console.log(`Message with offset ${message.offset} correctly received`);
    } else {
      console.log(`Error consuming message with offset ${message.offset}. Reason: ${parsed.error}. Message: ${stringPayload}`)
      throw parsed.error;
    }
  } else {
    // TODO Should this throw an error or log warning and ignore?
    throw Error(`Empty content for message with offset ${message.offset}`);
  }
}

