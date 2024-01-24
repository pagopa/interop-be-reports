import { ReadModelClient, Mailer, SafeMap } from '@interop-be-reports/commons'
import { ReadPreferenceMode } from 'mongodb'
import { ExcelGenerator, ReadModelQueries } from './services/index.js'
import { env } from './configs/env.js'
import {
  generateAgreementsWorksheetTableData,
  generateDescriptorsWorksheetTableData,
  generateTokensWorksheetTableData,
  getAllTenantsIdsFromAgreements,
  log,
} from './utils/helpers.util.js'
import { writeFileSync } from 'fs'

const EMAIL_SUBJECT = 'Metrics report'
const EMAIL_TEXT = 'Metrics report'
const REPORT_FILE_NAME = 'report.xlsx'

const readModel = await ReadModelClient.connect({
  mongodbReplicaSet: env.MONGODB_REPLICA_SET,
  mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
  mongodbReadPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
  mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
  readModelDbHost: env.READ_MODEL_DB_HOST,
  readModelDbPort: env.READ_MODEL_DB_PORT,
  readModelDbUser: env.READ_MODEL_DB_USER,
  readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
  readModelDbName: env.READ_MODEL_DB_NAME,
})

log.warn('Job started')
const readModelQueries = new ReadModelQueries(readModel)

log.warn('Fetching data from read model...')

const eservices = await readModelQueries.getAllEServices()
const agreements = await readModelQueries.getAllAgreements()
const purposes = await readModelQueries.getAllPurposes()

const tenantsIds = getAllTenantsIdsFromAgreements(agreements)
const tenants = await readModelQueries.getAllTenantsByIds(tenantsIds)

await readModel.close()

log.info('Getting table data...')

const eservicesMap = new SafeMap(eservices.map((eservice) => [eservice.id, eservice]))
const agreementsMap = new Map(agreements.map((agreement) => [agreement.id, agreement]))
const tenantsMap = new SafeMap(tenants.map((tenant) => [tenant.id, tenant]))

const agreementsWorksheetTableData = generateAgreementsWorksheetTableData(
  agreements,
  purposes,
  eservicesMap,
  tenantsMap
)
const descriptorsWorksheetTableData = generateDescriptorsWorksheetTableData(eservices, tenantsMap)
const tokensWorksheetTableData = await generateTokensWorksheetTableData(agreementsMap)

log.info('Generating excel file...')

const excel = await new ExcelGenerator()
  .addWorksheetTable({
    name: 'Agreements',
    data: agreementsWorksheetTableData,
  })
  .addWorksheetTable({
    name: 'Descriptors',
    data: descriptorsWorksheetTableData,
  })
  .addWorksheetTable({
    name: 'Tokens',
    data: tokensWorksheetTableData,
  })
  .generateExcelFile()

if (env.PRODUCE_OUTPUT) {
  log.info('Writing excel file...')
  writeFileSync(REPORT_FILE_NAME, excel)
}

log.info('Sending email...')

const mailer = new Mailer({
  name: env.SMTP_ADDRESS,
  host: env.SMTP_ADDRESS,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
})

await mailer.sendMail({
  from: env.SMTP_USER,
  to: env.MAIL_RECIPIENTS,
  subject: EMAIL_SUBJECT,
  text: EMAIL_TEXT,
  attachments: [{ filename: REPORT_FILE_NAME, content: excel }],
})

log.info('Job finished!')
