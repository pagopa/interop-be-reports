import { PurposeState, SafeMap } from '@interop-be-reports/commons'
import { Purpose, PurposeVersion, Tenant } from '../models/index.js'
import { PNDataCSVRow, StatoFinalitaMigliore } from '../models/pn-data-csv-row.model.js'

/**
 * Transforms a purpose to a CSV output row.
 * The row contains the following fields:
 * - `nome_comune`: The name of the tenant related to the purpose, retrived from the tenants map
 * - `stato_finalita_migliore`: The state of the purpose. It follows the following logic:
 *    1. If the purpose has an active version, the state is "Attivo";
 *    2. If the purpose has no active version, but has a suspended version, the state is "Sospeso";
 *    3. If the purpose has no active or suspended version, but has a waiting for approval version, the state is "In attesa di attivazione";
 *    4. If the purpose has no active, suspended or waiting for approval version, an error is thrown. This should never happen since the query that retrieves the purposes filters out purposes that do not have an active, suspended or waiting for approval version.
 * - `data_attivazione`: The first activation date of the purpose. It is retrieved from the firstActivationAt field of the active, suspended or waiting for approval version.
 * - `fonte_codice`: `tenant.externalId.origin``
 * - `codice`: `tenant.externalId.value`
 * - `carico_finalita_migliore`: `dailyCalls` value from the purpose of the `stato_finalita_migliore` field
 */
export function toCsvDataRow(tenantsMap: SafeMap<string, Tenant>, purpose: Purpose): PNDataCSVRow {
  function getPurposeVersionWithState(state: PurposeState): PurposeVersion | undefined {
    return purpose.versions.find((version) => version.state === state)
  }

  const activeVersion = getPurposeVersionWithState('Active')
  const suspendedVersion = getPurposeVersionWithState('Suspended')
  const waitingForApprovalVersion = getPurposeVersionWithState('WaitingForApproval')

  const relevantVersion = activeVersion || suspendedVersion || waitingForApprovalVersion

  if (!relevantVersion) {
    throw new Error(
      `Purpose ${purpose.id} has no active, suspended or waiting for activation version.`
    )
  }

  const state: StatoFinalitaMigliore = activeVersion
    ? 'Attivo'
    : suspendedVersion
    ? 'Sospeso'
    : 'In attesa di attivazione'

  const tenant = tenantsMap.get(purpose.consumerId)

  return PNDataCSVRow.parse({
    nome_comune: tenant.name,
    stato_finalita_migliore: state,
    data_attivazione: relevantVersion.firstActivationAt,
    fonte_codice: tenant.externalId.origin,
    codice: tenant.externalId.value,
    carico_finalita_migliore: relevantVersion.dailyCalls,
  })
}
