import { env } from "./config/env.js";
import { exitWithError, initConsumer } from "./consumer.js";
import { processMessage } from "./processor.js";

// TODO Logger

console.log("Starting consumer...")

const consumer = await initConsumer(env)
const configuredProcessor = processMessage(env.INTEROP_PRODUCT)

consumer.run({
  eachMessage: async ({ message }) => {
  try {
    return await configuredProcessor(message)
  } catch(err) {
    // TODO Terminate the consumer in case of error? or use a DLQ and proceeed?
    exitWithError(consumer)
  }}
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

