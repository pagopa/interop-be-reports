import {
  InteropTokenGenerator,
  ReadModelClient,
  ReadModelConfig,
  RefreshableInteropToken,
  TokenGenerationConfig,
} from '@interop-be-reports/commons'
import { ReadModelQueries, SftpClient, TenantProcessService, importAttributes } from './service/index.js'
import { SftpConfig, env } from './config/index.js'
import { filenameFromDate } from './utils/index.js'

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

const csvFileName = env.FORCE_REMOTE_FILE_NAME ?? filenameFromDate(env.SFTP_FILENAME_PREFIX, new Date())

const sftpConfig: SftpConfig = {
  host: env.SFTP_HOST,
  port: env.SFTP_PORT,
  username: env.SFTP_USERNAME,
  password: env.SFTP_PASSWORD,
  filePath: env.SFTP_PATH + csvFileName,
}

const tokenGeneratorConfig: TokenGenerationConfig = {
  kid: env.INTERNAL_JWT_KID,
  subject: env.INTERNAL_JWT_SUBJECT,
  issuer: env.INTERNAL_JWT_ISSUER,
  audience: env.INTERNAL_JWT_AUDIENCE,
  secondsDuration: env.INTERNAL_JWT_SECONDS_DURATION,
}

const sftpClient: SftpClient = new SftpClient(sftpConfig)
const readModelClient: ReadModelClient = await ReadModelClient.connect(readModelConfig)
const readModelQueries: ReadModelQueries = new ReadModelQueries(readModelClient)

const tokenGenerator = new InteropTokenGenerator(tokenGeneratorConfig)
const refreshableToken = new RefreshableInteropToken(tokenGenerator)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

await importAttributes(
  sftpClient,
  readModelQueries,
  tenantProcess,
  refreshableToken,
  env.RECORDS_PROCESS_BATCH_SIZE,
  env.ANAC_TENANT_ID
)

await readModelClient.close()
