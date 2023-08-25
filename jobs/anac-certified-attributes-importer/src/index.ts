import { env } from "./config/env.js"
// import sftp from 'ssh2-sftp-client'
import { parse } from 'csv/sync';
import { CsvRow, NonPaRow, PaRow } from './model/csv-row.js';
import { PersistentTenat } from "./model/tenant.model.js";

type BatchParseResult = {
  processedRecordsCount: number
  records: CsvRow[]
}
// const filePath = env.SFTP_PATH + env.FORCE_REMOTE_FILE_NAME
// const fileContent = await downloadCSV(filePath)

// const csv = await downloadCSV()
// const anacTenant = await getTenantById(env.ANAC_TENANT_ID)
// retrieveAttributeByExternalId(anacTenant.features.certifier.certifierId, env.ANAC_ATTR_1_CODE)
// ...


const fileContent =
  `cf_gestore,denominazione,domicilio_digitale,codice_IPA,anac_incaricato,anac_abilitato
0123456789,Comune 1,com1@une.it,IPA_123,TRUE,FALSE
0011223344,Procurement 1,proc1@urement.it,,TRUE,TRUE`

// xxxxx,Procurement x,,,TRUE,asd

await process()


async function process(): Promise<void> {
  const batchSize = env.RECORDS_PROCESS_BATCH_SIZE

  var scanComplete = false
  var fromLine = 1
  do {
    const batchResult = getBatch(fromLine, batchSize)

    // TODO Not sure these type checks are ok
    const paOrgs: PaRow[] = batchResult.records.map((org: CsvRow) => {
      if ("codice_ipa" in org && org.codice_ipa) return org as PaRow
      else return null
    }).filter((r): r is PaRow => r !== null)

    const nonPaOrgs: NonPaRow[] = batchResult.records.map((org: CsvRow) => {
      if ("codice_ipa" in org) return null
      else return org
    }).filter((r): r is NonPaRow => r !== null)
    //

    const paIpaCodes = paOrgs.map(org => org.codice_IPA)
    const nonPaTaxCodes = nonPaOrgs.map(org => org.cf_gestore)

    const paTenants = await getPATenants(paIpaCodes)
    const nonPaTenants = await getNonPATenants(nonPaTaxCodes)


    // const groupedByIsPA = _.groupBy(batchResult.records, record => record.codice_IPA !== undefined)
    // const ipaCodes = groupedByIsPA['true'].map(org => org.)
    // console.log(groupedByIsPA)

    fromLine = fromLine + batchSize
    scanComplete = batchResult.processedRecordsCount === 0
  } while (!scanComplete)

}

async function getPATenants(ipdaCodes: string[]): Promise<PersistentTenat[]> { return [] }
async function getNonPATenants(taxCodes: string[]): Promise<PersistentTenat[]> { return [] }

function getBatch(fromLine: number, batchSize: number): BatchParseResult {
  const rawRecords = parse(fileContent, { trim: true, columns: true, from: fromLine, to: fromLine + batchSize - 1 }) as Array<any>

  const records: CsvRow[] = rawRecords.map((value, index) => {
    const result = CsvRow.safeParse(value)
    if (result.success)
      return result.data
    else {
      console.log(`Error parsing row ${fromLine + index}`, result.error)
      return null
    }

  }).filter((r): r is CsvRow => r !== null)

  return {
    processedRecordsCount: rawRecords.length,
    records
  }
}

// async function downloadCSV(filePath: string): Promise<string> {

//   // Note: The file should be small enough to fit in memory

//   const sftpClient = new sftp()

//   await sftpClient.connect({
//     host: env.SFTP_HOST,
//     port: env.SFTP_PORT,
//     username: env.SFTP_USERNAME,
//     privateKey: env.SFTP_PRIVATE_KEY
//   })

//   const file = await sftpClient.get(filePath)

//   await sftpClient.end()

//   if (file instanceof Buffer)  // TODO Is this ok?
//     return file.toString()

//   if (typeof file === "string")
//     return file

//   // if (typeof file === "string" || file instanceof Buffer) {
//     // const rawRecords = parse(file, { trim: true, columns: true})

//   //   console.log(rawRecords)
//   // } else
//   throw Error("Unexpected stream returned from SFTP library")

// }








// const formatMemoryUsage = (data: number) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

// const memoryUsage = (memoryData: NodeJS.MemoryUsage) => ({
//   rss: `${formatMemoryUsage(memoryData.rss)}`, // -> Resident Set Size - total memory allocated for the process execution`,
//   heapTotal: `${formatMemoryUsage(memoryData.heapTotal)}`, // -> total size of the allocated heap`,
//   heapUsed: `${formatMemoryUsage(memoryData.heapUsed)}`, // -> actual memory used during the execution`,
//   external: `${formatMemoryUsage(memoryData.external)}`, // -> V8 external memory`,
// })

// const row: any = {
//   "cf_gestore": '0123456789',
//   "denominazione": 'Comune 1',
//   "domicilio_digitale": 'com1@une.it',
//   "codice_IPA": 'IPA_123',
//   "anac_incaricato": 'TRUE',
//   "anac_abilitato": 'FALSE'
// }

// console.log("Starting memory")
// console.log(memoryUsage(process.memoryUsage()))
// const runs = 100000
// var i = 0
// var arr: CsvRow[] = new Array(runs)
// console.log("Setup memory")
// console.log(memoryUsage(process.memoryUsage()))

// while(i < runs) {
//   arr[i] = CsvRow.parse(row)
//   i = i + 1
// }

// console.log("Final memory")
// console.log(memoryUsage(process.memoryUsage()))


