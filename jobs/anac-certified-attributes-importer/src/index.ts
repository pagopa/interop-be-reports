import { env } from "./config/env.js"
// import sftp from 'ssh2-sftp-client'
import { parse } from 'csv/sync';
import { CsvRow, NonPaRow, PaRow } from './model/csv-row.js';
import { getAttributeByExternalId, getNonPATenants, getPATenants, getTenantById } from "./service/read-model-queries.service.js";
import { InteropTokenGenerator, ReadModelClient, ReadModelConfig, RefreshableInteropToken, TokenGenerationConfig } from "@interop-be-reports/commons";
import { PersistentTenant } from "./model/tenant.model.js";
import { warn } from "./utils/logger.js";
import crypto from "crypto"
import { InteropContext } from "./model/interop-context.js";
import { TenantProcessService } from "./service/tenant-process.service.js";

// TODO Get name of csv header to force constraint?
const ANAC_ABILITATO_CODE = "anac_abilitato"
const ANAC_INCARICATO_CODE = "anac_incaricato"
const ANAC_IN_CONVALIDA_CODE = "anac_in_convalida"

type BatchParseResult = {
  processedRecordsCount: number
  records: CsvRow[]
}

type PersistentExternalId = {
  origin: string
  value: string
}

type AttributeIdentifiers = {
  id: string
  externalId: PersistentExternalId
}

type AnacAttributes = {
  anacAbilitato: AttributeIdentifiers,
  anacInConvalida: AttributeIdentifiers,
  anacIncaricato: AttributeIdentifiers
}

// const filePath = env.SFTP_PATH + env.FORCE_REMOTE_FILE_NAME
// const fileContent = await downloadCSV(filePath)

// const csv = await downloadCSV()
// const anacTenant = await getTenantById(env.ANAC_TENANT_ID)
// retrieveAttributeByExternalId(anacTenant.features.certifier.certifierId, env.ANAC_ATTR_1_CODE)
// ...


const tokenGeneratorConfig: TokenGenerationConfig = {
  kid: env.INTERNAL_JWT_KID,
  subject: env.INTERNAL_JWT_SUBJECT,
  issuer: env.INTERNAL_JWT_ISSUER,
  audience: env.INTERNAL_JWT_AUDIENCE,
  secondsDuration: env.INTERNAL_JWT_SECONDS_DURATION,
}

const tokenGenerator = new InteropTokenGenerator(tokenGeneratorConfig)
const refreshableToken = new RefreshableInteropToken(tokenGenerator)
const tenantProcess = new TenantProcessService(env.TENANT_PROCESS_URL)

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
const readModelClient: ReadModelClient = await ReadModelClient.connect(readModelConfig)


const fileContent =
  //   `cf_gestore,denominazione,domicilio_digitale,codice_IPA,anac_incaricato,anac_abilitato
  // 0123456789,Comune 1,com1@une.it,IPA_123,TRUE,FALSE
  // 0011223344,Procurement 1,proc1@urement.it,,TRUE,TRUE`
  `cf_gestore,denominazione,domicilio_digitale,codice_ipa,anac_incaricato,anac_abilitato,anac_in_convalida
0123456789,Nome ente presente in IPA,gsp1@pec.it,DRMEST,TRUE,FALSE,TRUE
0011223344,E-Procurement 1,eprocurement1@pec.it,,TRUE,TRUE,FALSE
0011223344,"E-Procurement 2 con , virgola nel nome",eprocurement1@pec.it,,TRUE,TRUE,FALSE`

// xxxxx,Procurement x,,,TRUE,asd

await process()

await readModelClient.close()


async function process(): Promise<void> {
  const jobCorrelationId = crypto.randomUUID()
  const batchSize = env.RECORDS_PROCESS_BATCH_SIZE

  const attributes: AnacAttributes = await getAttributesIdentifiers(readModelClient, env.TENANTS_COLLECTION_NAME, env.ATTRIBUTES_COLLECTION_NAME, env.ANAC_TENANT_ID)

  var scanComplete = false
  var fromLine = 1
  do {
    const batchResult: BatchParseResult = getBatch(fromLine, batchSize)

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

    processTenants(paOrgs, org => org.codice_ipa, codes => getPATenants(readModelClient, env.TENANTS_COLLECTION_NAME, codes), attributes, jobCorrelationId)
    processTenants(nonPaOrgs, org => org.cf_gestore, codes => getNonPATenants(readModelClient, env.TENANTS_COLLECTION_NAME, codes), attributes, jobCorrelationId)

    fromLine = fromLine + batchSize
    scanComplete = batchResult.processedRecordsCount === 0
  } while (!scanComplete)

}

async function getAttributesIdentifiers(readModelClient: ReadModelClient, tenantsCollectionName: string, attributesCollectionName: string, anacTenantId: string): Promise<AnacAttributes> {

  const anacTenant: PersistentTenant = await getTenantById(readModelClient, tenantsCollectionName, anacTenantId)
  const certifier = anacTenant.features.find(f => f.type === 'PersistentCertifier')

  if (!certifier) {
    throw Error(`Tenant with id ${anacTenantId} is not a certifier`)
  }

  const anacAbilitato = await getAttributeByExternalId(readModelClient, attributesCollectionName, certifier.certifierId, ANAC_ABILITATO_CODE)
  const anacIncaricato = await getAttributeByExternalId(readModelClient, attributesCollectionName, certifier.certifierId, ANAC_INCARICATO_CODE)
  const anacInConvalida = await getAttributeByExternalId(readModelClient, attributesCollectionName, certifier.certifierId, ANAC_IN_CONVALIDA_CODE)

  return {
    anacAbilitato: { id: anacAbilitato.id, externalId: { origin: anacAbilitato.origin, value: anacAbilitato.code } },
    anacIncaricato: { id: anacIncaricato.id, externalId: { origin: anacIncaricato.origin, value: anacIncaricato.code } },
    anacInConvalida: { id: anacInConvalida.id, externalId: { origin: anacInConvalida.origin, value: anacInConvalida.code } }
  }

}

async function processTenants<T extends CsvRow>(orgs: T[], extractTenantCode: (org: T) => string, retrieveTenants: (codes: string[]) => Promise<PersistentTenant[]>, attributes: AnacAttributes, correlationId: string) {

  const codes = orgs.map(extractTenantCode)

  const tenants = await retrieveTenants(codes)

  const missingTenants = getMissingTenants(codes, tenants)

  if (missingTenants.length !== 0)
    warn(correlationId, `Organizations in CSV not found in Tenants for codes: ${missingTenants}`)

  zipBy(orgs, tenants, extractTenantCode, tenant => tenant.externalId.value)
    .forEach(async ([org, tenant]) => {
      if (org.anac_abilitato)
        await assignAttribute(tenant, attributes.anacAbilitato)
      else
        await unassignAttribute(tenant, attributes.anacAbilitato)

      if (org.anac_in_convalida)
        await assignAttribute(tenant, attributes.anacInConvalida)
      else
        await unassignAttribute(tenant, attributes.anacInConvalida)

      if (org.anac_incaricato)
        await assignAttribute(tenant, attributes.anacIncaricato)
      else
        await unassignAttribute(tenant, attributes.anacIncaricato)

    })

  // TODO Take actual attributes flag to assing/unassign
  // cartesian(attributes, tenants)
  //   .forEach(async ([attribute, tenant]) => assignAttribute(tenant, attribute))

}

/**
 * Zip two arrays based on a matching key
 * Non-matching values are discarded
 * @param a 
 * @param b 
 * @param getValueA Function that extracts the key for array a
 * @param getValueB Function that extracts the key for array b
 * @returns 
 */
function zipBy<A, B, K>(a: A[], b: B[], getValueA: (a: A) => K, getValueB: (b: B) => K): [A, B][] {
  const mapB = new Map<K, B>()

  b.forEach(bv => mapB.set(getValueB(bv), bv))

  return a
    .map(av => [av, mapB.get(getValueA(av))])
    .filter(([_, bv]) => bv !== undefined) as [A, B][] // TODO Is there a better way to match types?
}

async function assignAttribute(tenant: PersistentTenant, attribute: AttributeIdentifiers): Promise<void> {
  if (!tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized
    }
    await tenantProcess.internalAssignCertifiedAttribute(tenant.externalId.origin, tenant.externalId.value, attribute.externalId.origin, attribute.externalId.value, context)
  }
}

async function unassignAttribute(tenant: PersistentTenant, attribute: AttributeIdentifiers): Promise<void> {
  if (tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized
    }
    await tenantProcess.internalRevokeCertifiedAttribute(tenant.externalId.origin, tenant.externalId.value, attribute.externalId.origin, attribute.externalId.value, context)
  }
}


// function cartesian<A, B>(a: A[], b: B[]): [A, B][] {
//   const toTuple = (a: A, b: B): [A, B] => [a, b]
//   return a.flatMap(a => b.map(b => toTuple(a, b)))
// }

function tenantContainsAttribute(tenant: PersistentTenant, attributeId: string): boolean {
  return tenant.attributes.find(attribute => attribute.id === attributeId) !== undefined
}

function getMissingTenants(expectedExternalId: string[], tenants: PersistentTenant[]): string[] {
  const existingSet = new Set(tenants.map(t => t.externalId.value))

  return expectedExternalId.filter(v => !existingSet.has(v))
}

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


