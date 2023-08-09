import { Kafka, KafkaMessage } from "kafkajs";
import { EventPayload } from "./model/InstitutionEvent.js";
import { env } from "./config/env.js";

// TODO Logger

console.log("Starting consumer...")

const kafka = new Kafka({
  clientId: env.BROKER_CLIENT_ID,
  brokers: env.SELFCARE_BROKER_URLS,
  ssl: true,
  sasl: {
    mechanism: 'plain',
    username: '$ConnectionString',
    password: env.BROKER_CONNECTION_STRING
  },
})

const consumer = kafka.consumer({ groupId: 'interop-institutions' })

function exitGracefully(): void {
  consumer.disconnect().finally(() => {
    console.log("Consumer disconnected");
    process.exit(0);
  });
}

process.on("SIGINT", exitGracefully);
process.on("SIGTERM", exitGracefully);

async function processMessage(message: KafkaMessage): Promise<void> {
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

await consumer.connect();

await consumer.subscribe({ topic: env.TOPIC_NAME, fromBeginning: true }); // TODO Evaluate the use of fromBeginning


consumer.run({
  // autoCommit: false, // TODO Remove, just for testing purposes
  eachMessage: async ({ message }) => processMessage(message)
})

// TODO Remove, just for testing purposes
// Reset offsets for all partitions
await consumer.seek({ topic: env.TOPIC_NAME, partition: 0, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 1, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 2, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 3, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 4, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 5, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 6, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 7, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 8, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 9, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 10, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 11, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 12, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 13, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 14, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 15, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 16, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 17, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 18, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 19, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 20, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 21, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 22, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 23, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 24, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 25, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 26, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 27, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 28, offset: "-2" });
await consumer.seek({ topic: env.TOPIC_NAME, partition: 29, offset: "-2" });
// END TODO

