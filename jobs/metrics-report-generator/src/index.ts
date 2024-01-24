import { Mailer, SafeMap } from '@interop-be-reports/commons'
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
import { TokensQueriesService } from './services/athena-queries.service.js'

const EMAIL_SUBJECT = 'Metrics report'
const EMAIL_TEXT = 'Metrics report'
const REPORT_FILE_NAME = 'report.xlsx'

log.warn('Job started')

const readModelQueries = await ReadModelQueries.connect()

log.warn('Fetching data from read model...')

const eservices = await readModelQueries.getAllEServices()
const agreements = await readModelQueries.getAllAgreements()
const purposes = await readModelQueries.getAllPurposes()
const tenants = await readModelQueries.getAllTenantsByIds(getAllTenantsIdsFromAgreements(agreements))

await readModelQueries.close()

log.info('Fetching tokens data...')

const tokenQueries = new TokensQueriesService()
const tokens = await tokenQueries.getTokensData()

log.info('Generating excel file...')

const eservicesMap = new SafeMap(eservices.map((eservice) => [eservice.id, eservice]))
const agreementsMap = new Map(agreements.map((agreement) => [agreement.id, agreement]))
const tenantsMap = new SafeMap(tenants.map((tenant) => [tenant.id, tenant]))

const excel = await new ExcelGenerator()
  .addWorksheetTable({
    name: 'Agreements',
    data: generateAgreementsWorksheetTableData(agreements, purposes, eservicesMap, tenantsMap),
  })
  .addWorksheetTable({
    name: 'Descriptors',
    data: generateDescriptorsWorksheetTableData(eservices, tenantsMap),
  })
  .addWorksheetTable({
    name: 'Tokens',
    data: generateTokensWorksheetTableData(tokens, agreementsMap),
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
