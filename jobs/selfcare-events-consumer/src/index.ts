import { env } from "./config/env.js";
import { exitWithError, initConsumer } from "./services/consumer.js";
import { processMessage } from "./services/processor.js";
import { InteropTokenGenerator, TokenGenerationConfig } from '@interop-be-reports/commons'
import { TenantProcessService } from "./services/tenantProcessService.js";

console.log("Starting consumer...")

const tokenGeneratorConfig: TokenGenerationConfig = {
  kid: env.INTERNAL_JWT_KID,
  subject: env.INTERNAL_JWT_SUBJECT,
  issuer: env.INTERNAL_JWT_ISSUER,
  audience: env.INTERNAL_JWT_AUDIENCE,
  secondsDuration: env.INTERNAL_JWT_SECONDS_DURATION,
}

const consumer = await initConsumer(env)
const tokenGenerator = new InteropTokenGenerator(tokenGeneratorConfig)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

const configuredProcessor = processMessage(tokenGenerator, tenantProcess, env.INTEROP_PRODUCT)

consumer.run({
  eachMessage: async ({ message, partition }) => {
    try {
      return await configuredProcessor(message, partition)
    } catch (err) {
      // TODO Terminate the consumer in case of error? or use a DLQ and proceed?
      exitWithError(consumer, err)
    }
  }
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

