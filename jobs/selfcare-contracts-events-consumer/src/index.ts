import { env } from "./config/env.js";
import { exitWithError, initConsumer } from "./services/consumer.js";
import { processMessage } from "./services/processor.js";
import { InteropTokenGenerator, RefreshableInteropToken, TokenGenerationConfig } from '@interop-be-reports/commons'
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
const refreshableToken = new RefreshableInteropToken(tokenGenerator)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

await refreshableToken.init()

const configuredProcessor = processMessage(refreshableToken, tenantProcess, env.INTEROP_PRODUCT)

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
