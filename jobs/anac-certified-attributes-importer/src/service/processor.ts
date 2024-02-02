import { ANAC_ABILITATO_CODE, ANAC_INCARICATO_CODE, ANAC_IN_CONVALIDA_CODE } from '../config/index.js'
import { parse } from 'csv/sync'
import {
  CsvRow,
  NonPaRow,
  PaRow,
  PersistentTenant,
  InteropContext,
  AnacAttributes,
  BatchParseResult,
  AttributeIdentifiers,
} from '../model/index.js'
import { ReadModelQueries, SftpClient, TenantProcessService } from '../service/index.js'
import { RefreshableInteropToken, zipBy, logError, logWarn, logInfo } from '@interop-be-reports/commons'
import crypto from 'crypto'
import { AgreementProcessService } from './agreement-process.service.js'

export async function importAttributes(
  sftpClient: SftpClient,
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  agreementProcess: AgreementProcessService,
  refreshableToken: RefreshableInteropToken,
  recordsBatchSize: number,
  anacTenantId: string
): Promise<void> {
  const jobCorrelationId = crypto.randomUUID()

  logInfo(jobCorrelationId, "ANAC Certified attributes importer started")

  const fileContent = await sftpClient.downloadCSV(jobCorrelationId)

  const attributes: AnacAttributes = await getAttributesIdentifiers(readModel, anacTenantId)

  const allOrgsInFile = await processFileContent(readModel, tenantProcess, refreshableToken, fileContent, attributes, recordsBatchSize, jobCorrelationId)

  if (allOrgsInFile.length === 0) {
    throw new Error("File does not contain valid assignments")
  }

  await unassignMissingOrgsAttributes(readModel, tenantProcess, agreementProcess, refreshableToken, allOrgsInFile, attributes, jobCorrelationId)

  logInfo(jobCorrelationId, "ANAC Certified attributes importer completed")
}

async function processFileContent(readModel: ReadModelQueries, tenantProcess: TenantProcessService, refreshableToken: RefreshableInteropToken, fileContent: string, attributes: AnacAttributes, recordsBatchSize: number, jobCorrelationId: string): Promise<string[]> {

  const batchSize = recordsBatchSize

  const processTenants = prepareTenantsProcessor(tenantProcess, refreshableToken, attributes, jobCorrelationId)

  let scanComplete = false
  let fromLine = 1
  let allOrgsInFile: string[] = []

  do {
    const batchResult: BatchParseResult = getBatch(fileContent, fromLine, batchSize, jobCorrelationId)

    const paOrgs: PaRow[] = batchResult.records
      .map((org: CsvRow) => {
        if ('codice_ipa' in org) return org
        else return null
      })
      .filter((r): r is PaRow => r !== null)

    const nonPaOrgs: NonPaRow[] = batchResult.records
      .map((org: CsvRow) => {
        if ('codice_ipa' in org) return null
        else return org
      })
      .filter((r): r is NonPaRow => r !== null)

    await processTenants(
      paOrgs,
      (org) => org.codice_ipa,
      (codes) => readModel.getPATenants(codes)
    )
    await processTenants(
      nonPaOrgs,
      (org) => org.cf_gestore,
      (codes) => readModel.getNonPATenants(codes)
    )

    allOrgsInFile = allOrgsInFile.concat(paOrgs.map(o => o.codice_ipa)).concat(nonPaOrgs.map(o => o.cf_gestore))

    fromLine = fromLine + batchSize
    scanComplete = batchResult.processedRecordsCount === 0
  } while (!scanComplete)

  return allOrgsInFile
}

async function unassignMissingOrgsAttributes(
  readModel: ReadModelQueries,
  tenantProcess: TenantProcessService,
  agreementProcess: AgreementProcessService,
  refreshableToken: RefreshableInteropToken,
  allOrgsInFile: string[],
  attributes: AnacAttributes,
  jobCorrelationId: string) {

  logInfo(jobCorrelationId, "Revoking attributes for organizations not in file...")

  const tenantsWithAttribute = await readModel.getTenantsWithAttributes([attributes.anacAbilitato.id, attributes.anacInConvalida.id, attributes.anacIncaricato.id])
  await Promise.all(tenantsWithAttribute
    .filter(tenant => !allOrgsInFile.includes(tenant.externalId.value))
    .map(async tenant => {
      await archiveAgreements(readModel, agreementProcess, refreshableToken, tenant.id, attributes)
      await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacAbilitato)
      await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacInConvalida)
      await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacIncaricato)
    })
  )

  logInfo(jobCorrelationId, "Attributes revocation completed")
}

async function getAttributesIdentifiers(readModel: ReadModelQueries, anacTenantId: string): Promise<AnacAttributes> {
  const anacTenant: PersistentTenant = await readModel.getTenantById(anacTenantId)
  const certifier = anacTenant.features.find((f) => f.type === 'PersistentCertifier')

  if (!certifier) {
    throw Error(`Tenant with id ${anacTenantId} is not a certifier`)
  }

  const anacAbilitato = await readModel.getAttributeByExternalId(certifier.certifierId, ANAC_ABILITATO_CODE)
  const anacIncaricato = await readModel.getAttributeByExternalId(certifier.certifierId, ANAC_INCARICATO_CODE)
  const anacInConvalida = await readModel.getAttributeByExternalId(certifier.certifierId, ANAC_IN_CONVALIDA_CODE)

  return {
    anacAbilitato: { id: anacAbilitato.id, externalId: { origin: anacAbilitato.origin, value: anacAbilitato.code } },
    anacIncaricato: {
      id: anacIncaricato.id,
      externalId: { origin: anacIncaricato.origin, value: anacIncaricato.code },
    },
    anacInConvalida: {
      id: anacInConvalida.id,
      externalId: { origin: anacInConvalida.origin, value: anacInConvalida.code },
    },
  }
}

const prepareTenantsProcessor =
  (
    tenantProcess: TenantProcessService,
    refreshableToken: RefreshableInteropToken,
    attributes: AnacAttributes,
    jobCorrelationId: string
  ) => async function processTenants<T extends CsvRow>(
    orgs: T[],
    extractTenantCode: (org: T) => string,
    retrieveTenants: (codes: string[]) => Promise<PersistentTenant[]>
  ): Promise<void> {
      if (orgs.length === 0) return

      const codes = orgs.map(extractTenantCode)

      const tenants = await retrieveTenants(codes)

      const missingTenants = getMissingTenants(codes, tenants)

      if (missingTenants.length !== 0)
        logWarn(jobCorrelationId, `Organizations in CSV not found in Tenants for codes: ${missingTenants}`)

      await Promise.all(
        zipBy(orgs, tenants, extractTenantCode, (tenant) => tenant.externalId.value).map(async ([org, tenant]) => {
          if (org.anac_abilitato) await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacAbilitato)
          else await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacAbilitato)

          if (org.anac_in_convalida)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacInConvalida)
          else await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacInConvalida)

          if (org.anac_incaricato)
            await assignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacIncaricato)
          else await unassignAttribute(tenantProcess, refreshableToken, tenant, attributes.anacIncaricato)
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

async function archiveAgreements(
  readModel: ReadModelQueries,
  agreementProcess: AgreementProcessService,
  refreshableToken: RefreshableInteropToken,
  tenantId: string,
  attributes: AnacAttributes): Promise<void> {
  const agreements = await readModel.getArchivableAgreements(tenantId, [attributes.anacInConvalida.id, attributes.anacIncaricato.id, attributes.anacAbilitato.id])

  const token = await refreshableToken.get()
  const context: InteropContext = {
    correlationId: crypto.randomUUID(),
    bearerToken: token.serialized,
  }

  await Promise.all(agreements.map(async agreement => await agreementProcess.archiveAgreement(agreement.id, context)))
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
    relax_quotes: true,
    from: fromLine,
    to: fromLine + batchSize - 1,
  }) as Array<object>

  const records: CsvRow[] = rawRecords
    .map((value, index) => {
      const result = CsvRow.safeParse(value)
      if (result.success) return result.data
      else {
        logError(jobCorrelationId, `Error parsing row ${fromLine + index}`, result.error)
        return null
      }
    })
    .filter((r): r is CsvRow => r !== null)

  return {
    processedRecordsCount: rawRecords.length,
    records,
  }
}
