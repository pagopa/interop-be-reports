import { ReadModelClient, Mailer, SafeMap } from '@interop-be-reports/commons'
import { ReadPreferenceMode } from 'mongodb'
import { ExcelGenerator, ReadModelQueries } from './services/index.js'
import { env } from './configs/env.js'
import {
  generateAgreementsWorksheetTableData,
  generateDescriptorsWorksheetTableData,
  getAllTenantsIdsFromAgreements,
} from './utils/helpers.util.js'

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

const readModelQueries = new ReadModelQueries(readModel)

const eservices = await readModelQueries.getAllEServices()
const agreements = await readModelQueries.getAllAgreements()
const purposes = await readModelQueries.getAllPurposes()

const tenantsIds = getAllTenantsIdsFromAgreements(agreements)
const tenants = await readModelQueries.getAllTenantsByIds(tenantsIds)

const eservicesMap = new SafeMap(eservices.map((eservice) => [eservice.id, eservice]))
const tenantsMap = new SafeMap(tenants.map((tenant) => [tenant.id, tenant]))

await readModel.close()

const excel = await new ExcelGenerator()
  .addWorksheetTable({
    name: 'Agreements',
    data: generateAgreementsWorksheetTableData(agreements, purposes, eservicesMap, tenantsMap),
  })
  .addWorksheetTable({
    name: 'Descriptors',
    data: generateDescriptorsWorksheetTableData(eservices, tenantsMap),
  })
  .generateExcelFile()

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
  subject: 'ciao',
  text: 'ciao ciao',
  attachments: [{ filename: 'ciao.xlsx', content: excel }],
})
