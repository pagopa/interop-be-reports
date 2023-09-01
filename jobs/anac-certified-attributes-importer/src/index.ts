import { InteropTokenGenerator, ReadModelClient, ReadModelConfig, RefreshableInteropToken, TokenGenerationConfig } from '@interop-be-reports/commons'
import { SftpClient, TenantProcessService, process } from './service/index.js'
import { SftpConfig, env } from './config/index.js'


// const fileContent =
//   `cf_gestore,denominazione,domicilio_digitale,codice_ipa,anac_incaricato,anac_abilitato,anac_in_convalida
// 0123456789,Nome ente presente in IPA,gsp1@pec.it,DRMEST,TRUE,FALSE,TRUE
// 0011223344,E-Procurement 1,eprocurement1@pec.it,,TRUE,TRUE,FALSE
// 0011223344,"E-Procurement 2 con , virgola nel nome",eprocurement1@pec.it,,TRUE,TRUE,FALSE`


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

const sftpConfig: SftpConfig = {
  host: env.SFTP_HOST,
  port: env.SFTP_PORT,
  username: env.SFTP_USERNAME,
  privateKey: env.SFTP_PRIVATE_KEY,
  filePath: env.SFTP_PATH + env.FORCE_REMOTE_FILE_NAME,
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

const tokenGenerator = new InteropTokenGenerator(tokenGeneratorConfig)
const refreshableToken = new RefreshableInteropToken(tokenGenerator)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

await process(sftpClient, readModelClient, tenantProcess, refreshableToken)

await readModelClient.close()
