import { ReadModelQueriesClient } from './services/index.js'
import { toCsvDataRow } from './utils/index.js'
import { CSV_FILENAME, MAIL_BODY, MAIL_SUBJECT, env } from './configs/index.js'
import { Mailer, SafeMap, toCSV, withExecutionTime } from '@interop-be-reports/commons'

const log = console.log

async function main() {
  log('Program started.\n')

  log('> Connecting to database...')
  const readModelsQueriesClient = await ReadModelQueriesClient.connect()
  log('> Connected to database!\n')

  log('> Getting data...')
  const purposes = await readModelsQueriesClient.getPNEServicePurposes()

  if (purposes.length === 0) {
    log('> No purposes data found. Exiting program.')
    process.exit(0)
  }

  const tenantsIds = [...new Set(purposes.map((purpose) => purpose.consumerId))]
  const tenants = await readModelsQueriesClient.getComuniByTenantsIds(tenantsIds)

  const tenantNamesMap = new SafeMap(tenants.map((tenant) => [tenant.id, tenant.name]))
  const csvData = purposes.map(toCsvDataRow.bind(null, tenantNamesMap))

  log('> Data csv produced!\n')

  log('> Sending emails...')

  const mailer = new Mailer({
    host: env.SMTP_ADDRESS,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },
  })

  mailer.sendMail({
    from: env.SMTP_USER,
    to: env.MAIL_RECIPIENTS,
    subject: MAIL_SUBJECT,
    text: MAIL_BODY,
    attachments: [{ filename: CSV_FILENAME, content: toCSV(csvData) }],
  })

  log('> Success!\n')
  log('End of program.')

  await readModelsQueriesClient.close()
  process.exit(0)
}

withExecutionTime(main)
