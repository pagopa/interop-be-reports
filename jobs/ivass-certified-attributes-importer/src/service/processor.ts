import { IVASS_INSURANCES_ATTRIBUTE_CODE } from '../config/constants.js'
import { parse } from 'csv/sync'
import { RefreshableInteropToken, zipBy, logError, logWarn, logInfo } from '@interop-be-reports/commons'
import crypto from 'crypto'
import { AttributeIdentifiers, BatchParseResult, IvassAttributes } from '../model/processor.model.js'
import { TenantProcessService } from './tenant-process.service.js'
import { PersistentTenant } from '../model/tenant.model.js'
import { CsvRow, RawCsvRow } from '../model/csv-row.model.js'
import { InteropContext } from '../model/interop-context.model.js'
import { ReadModelQueries } from './read-model-queries.service.js'

export async function importAttributes(
  csvDownloader: () => Promise<string>,
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  recordsBatchSize: number,
  ivassTenantId: string
): Promise<void> {
  const jobCorrelationId = crypto.randomUUID()

  logInfo(jobCorrelationId, "IVASS Certified attributes importer started")

  const batchSize = recordsBatchSize

  const fileContent = await csvDownloader()

  const attributes: IvassAttributes = await getAttributesIdentifiers(readModel, ivassTenantId)

  const processTenants = prepareTenantsProcessor(tenantProcess, refreshableToken, attributes, jobCorrelationId)

  let scanComplete = false
  let fromLine = 1

  do {
    const batchResult: BatchParseResult = getBatch(fileContent, fromLine, batchSize, jobCorrelationId)

    await processTenants(
      batchResult.records,
      (org) => org.CODICE_FISCALE,
      (codes) => readModel.getIVASSTenants(codes)
    )

    fromLine = fromLine + batchSize
    scanComplete = batchResult.processedRecordsCount === 0
  } while (!scanComplete)

  logInfo(jobCorrelationId, "IVASS Certified attributes importer completed")
}

async function getAttributesIdentifiers(readModel: ReadModelQueries, ivassTenantId: string): Promise<IvassAttributes> {
  const ivassTenant: PersistentTenant = await readModel.getTenantById(ivassTenantId)
  const certifier = ivassTenant.features.find((f) => f.type === 'PersistentCertifier')

  if (!certifier) {
    throw Error(`Tenant with id ${ivassTenantId} is not a certifier`)
  }

  const ivassInsurances = await readModel.getAttributeByExternalId(certifier.certifierId, IVASS_INSURANCES_ATTRIBUTE_CODE)

  return {
    ivassInsurances: { id: ivassInsurances.id, externalId: { origin: ivassInsurances.origin, value: ivassInsurances.code } },
  }
}

const prepareTenantsProcessor =
  (
    tenantProcess: TenantProcessService,
    refreshableToken: RefreshableInteropToken,
    attributes: IvassAttributes,
    jobCorrelationId: string
  ) => async function processTenants<T extends CsvRow>(
    orgs: T[],
    extractTenantCode: (org: T) => string,
    retrieveTenants: (codes: string[]) => Promise<PersistentTenant[]>
  ): Promise<void> {
      const validOrgs = orgs.filter(org => org.CODICE_FISCALE)
      if (validOrgs.length === 0) return

      const codes = validOrgs.map(extractTenantCode)

      const tenants = await retrieveTenants(codes)

      const missingTenants = getMissingTenants(codes, tenants)

      if (missingTenants.length !== 0)
        logWarn(jobCorrelationId, `Organizations in CSV not found in Tenants for codes: ${missingTenants}`)

      const now = Date.now()

      await Promise.all(
        zipBy(validOrgs, tenants, extractTenantCode, (tenant) => tenant.externalId.value).map(async ([org, tenant]) => {

          if (org.DATA_ISCRIZIONE_ALBO_ELENCO.getDate() < now && org.DATA_CANCELLAZIONE_ALBO_ELENCO.getDate() > now)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.ivassInsurances)
          else await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.ivassInsurances)
        })
      )
    }

async function assignAttribute(
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  tenant: PersistentTenant,
  attribute: AttributeIdentifiers
): Promise<void> {
  if (!tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized,
    }
    await tenantProcess.internalAssignCertifiedAttribute(
      tenant.externalId.origin,
      tenant.externalId.value,
      attribute.externalId.origin,
      attribute.externalId.value,
      context
    )
  }
}

async function unassignAttribute(
  tenantProcess: TenantProcessService,
  refreshableToken: RefreshableInteropToken,
  tenant: PersistentTenant,
  attribute: AttributeIdentifiers
): Promise<void> {
  if (tenantContainsAttribute(tenant, attribute.id)) {
    const token = await refreshableToken.get()
    const context: InteropContext = {
      correlationId: crypto.randomUUID(),
      bearerToken: token.serialized,
    }
    await tenantProcess.internalRevokeCertifiedAttribute(
      tenant.externalId.origin,
      tenant.externalId.value,
      attribute.externalId.origin,
      attribute.externalId.value,
      context
    )
  }
}

function tenantContainsAttribute(tenant: PersistentTenant, attributeId: string): boolean {
  return tenant.attributes.find((attribute) => attribute.id === attributeId) !== undefined
}

function getMissingTenants(expectedExternalId: string[], tenants: PersistentTenant[]): string[] {
  const existingSet = new Set(tenants.map((t) => t.externalId.value))

  return expectedExternalId.filter((v) => !existingSet.has(v))
}

function getBatch(
  fileContent: string,
  fromLine: number,
  batchSize: number,
  jobCorrelationId: string
): BatchParseResult {
  const rawRecords = parse(fileContent, {
    trim: true,
    columns: true,
    from: fromLine,
    to: fromLine + batchSize - 1,
  }) as Array<object>

  const records: CsvRow[] = rawRecords
    .map((value, index) => {
      const result = RawCsvRow.safeParse(value)
      if (result.success) return result.data
      else {
        logError(jobCorrelationId, `Error parsing row ${fromLine + index}`, result.error)
        return null
      }
    })
    .map(r => {
      if (!r || !r.CODICE_FISCALE) return null;
      else return {
        DATA_ISCRIZIONE_ALBO_ELENCO: r?.DATA_ISCRIZIONE_ALBO_ELENCO,
        DATA_CANCELLAZIONE_ALBO_ELENCO: r?.DATA_CANCELLAZIONE_ALBO_ELENCO,
        CODICE_FISCALE: r?.CODICE_FISCALE,
      }
    })
    .filter((r): r is CsvRow => r !== null)

  return {
    processedRecordsCount: rawRecords.length,
    records,
  }
}
