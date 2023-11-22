import { env } from "./config/env.js";
import { SourceFileConfig } from "./config/sourcefile.config.js";
import { downloadCSV } from "./service/file-downloader.js";
import {
  InteropTokenGenerator,
  ReadModelClient,
  ReadModelConfig,
  RefreshableInteropToken,
  TokenGenerationConfig,
} from '@interop-be-reports/commons'
import { ReadModelQueries } from "./service/read-model-queries.service.js";
import { TenantProcessService } from "./service/tenant-process.service.js";
import { importAttributes } from "./service/processor.js";

const sourceFileConfig: SourceFileConfig = {
  sourceUrl: env.SOURCE_URL,
  outputDir: env.SOURCE_FILE_DOWNLOAD_DIR
}

const readModelConfig: ReadModelConfig = {
  mongodbReplicaSet: env.MONGODB_REPLICA_SET,
  mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
  mongodbReadPreference: env.MONGODB_READ_PREFERENCE,
  mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
  readModelDbUser: env.READ_MODEL_DB_USER,
  readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
  readModelDbHost: env.READ_MODEL_DB_HOST,
  readModelDbPort: env.READ_MODEL_DB_PORT,
  readModelDbName: env.READ_MODEL_DB_NAME,
}

const tokenGeneratorConfig: TokenGenerationConfig = {
  kid: env.INTERNAL_JWT_KID,
  subject: env.INTERNAL_JWT_SUBJECT,
  issuer: env.INTERNAL_JWT_ISSUER,
  audience: env.INTERNAL_JWT_AUDIENCE,
  secondsDuration: env.INTERNAL_JWT_SECONDS_DURATION,
}

const csvDownloader = () => downloadCSV(sourceFileConfig)
const readModelClient: ReadModelClient = await ReadModelClient.connect(readModelConfig)
const readModelQueries: ReadModelQueries = new ReadModelQueries(readModelClient)

const tokenGenerator = new InteropTokenGenerator(tokenGeneratorConfig)
const refreshableToken = new RefreshableInteropToken(tokenGenerator)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

await importAttributes(
  csvDownloader,
  readModelQueries,
  tenantProcess,
  refreshableToken,
  env.RECORDS_PROCESS_BATCH_SIZE,
  env.IVASS_TENANT_ID
)

await readModelClient.close()
