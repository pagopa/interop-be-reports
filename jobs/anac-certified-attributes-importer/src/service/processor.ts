import { env } from "../config/index.js"
import { parse } from 'csv/sync';
import { CsvRow, NonPaRow, PaRow, PersistentTenant, InteropContext } from '../model/index.js';
import { getAttributeByExternalId, getNonPATenants, getPATenants, getTenantById, SftpClient, TenantProcessService } from "../service/index.js";
import { ReadModelClient, RefreshableInteropToken, zipBy } from "@interop-be-reports/commons";
import { error, warn } from "../utils/logger.js";
import crypto from "crypto"

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


export async function process(sftpClient: SftpClient, readModelClient: ReadModelClient, tenantProcess: TenantProcessService, refreshableToken: RefreshableInteropToken): Promise<void> {
  const jobCorrelationId = crypto.randomUUID()
  const batchSize = env.RECORDS_PROCESS_BATCH_SIZE

  const fileContent = await sftpClient.downloadCSV()

  const attributes: AnacAttributes = await getAttributesIdentifiers(readModelClient, env.TENANTS_COLLECTION_NAME, env.ATTRIBUTES_COLLECTION_NAME, env.ANAC_TENANT_ID)

  const preparedProcessTenants = processTenants(tenantProcess, refreshableToken, attributes, jobCorrelationId)

  var scanComplete = false
  var fromLine = 1

  do {
    const batchResult: BatchParseResult = getBatch(fileContent, fromLine, batchSize, jobCorrelationId)

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

    preparedProcessTenants(paOrgs, org => org.codice_ipa, codes => getPATenants(readModelClient, env.TENANTS_COLLECTION_NAME, codes))
    preparedProcessTenants(nonPaOrgs, org => org.cf_gestore, codes => getNonPATenants(readModelClient, env.TENANTS_COLLECTION_NAME, codes))

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

const processTenants =
  (tenantProcess: TenantProcessService, refreshableToken: RefreshableInteropToken, attributes: AnacAttributes, jobCorrelationId: string) =>
    async <T extends CsvRow>(orgs: T[], extractTenantCode: (org: T) => string, retrieveTenants: (codes: string[]) => Promise<PersistentTenant[]>) => {

      const codes = orgs.map(extractTenantCode)

      const tenants = await retrieveTenants(codes)

      const missingTenants = getMissingTenants(codes, tenants)

      if (missingTenants.length !== 0)
        warn(jobCorrelationId, `Organizations in CSV not found in Tenants for codes: ${missingTenants}`)

      zipBy(orgs, tenants, extractTenantCode, tenant => tenant.externalId.value)
        .forEach(async ([org, tenant]) => {
          if (org.anac_abilitato)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacAbilitato)
          else
            await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacAbilitato)

          if (org.anac_in_convalida)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacInConvalida)
          else
            await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacInConvalida)

          if (org.anac_incaricato)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacIncaricato)
          else
            await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacIncaricato)

        })

    }

async function assignAttribute(tenantProcess: TenantProcessService, refreshableToken: RefreshableInteropToken, tenant: PersistentTenant, attribute: AttributeIdentifiers): Promise<void> {
  if (!tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized
    }
    await tenantProcess.internalAssignCertifiedAttribute(tenant.externalId.origin, tenant.externalId.value, attribute.externalId.origin, attribute.externalId.value, context)
  }
}

async function unassignAttribute(tenantProcess: TenantProcessService, refreshableToken: RefreshableInteropToken, tenant: PersistentTenant, attribute: AttributeIdentifiers): Promise<void> {
  if (tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized
    }
    await tenantProcess.internalRevokeCertifiedAttribute(tenant.externalId.origin, tenant.externalId.value, attribute.externalId.origin, attribute.externalId.value, context)
  }
}

function tenantContainsAttribute(tenant: PersistentTenant, attributeId: string): boolean {
  return tenant.attributes.find(attribute => attribute.id === attributeId) !== undefined
}

function getMissingTenants(expectedExternalId: string[], tenants: PersistentTenant[]): string[] {
  const existingSet = new Set(tenants.map(t => t.externalId.value))

  return expectedExternalId.filter(v => !existingSet.has(v))
}

function getBatch(fileContent: string, fromLine: number, batchSize: number, jobCorrelationId: string): BatchParseResult {
  const rawRecords = parse(fileContent, { trim: true, columns: true, from: fromLine, to: fromLine + batchSize - 1 }) as Array<any>

  const records: CsvRow[] = rawRecords.map((value, index) => {
    const result = CsvRow.safeParse(value)
    if (result.success)
      return result.data
    else {
      error(jobCorrelationId, `Error parsing row ${fromLine + index}`, result.error)
      return null
    }

  }).filter((r): r is CsvRow => r !== null)

  return {
    processedRecordsCount: rawRecords.length,
    records
  }
}
