import { Purpose, PurposeState } from '../models/purposes.models.js'

/**
 * Converts an array of objects to CSV format.
 * If the array is empty, an empty string is returned.
 *
 * @param data - The array of objects to convert to CSV
 * @returns The CSV string
 */
export function toCSV(data: Array<Record<string, string>>) {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0]).join(',') + '\n'
  const columns = data.map((row) => Object.values(row).join(',')).join('\n')

  return headers + columns
}

/**
 * An extended Map that throws an error if the key is not found.
 */
export class SafeMap<K, V> extends Map<K, V> {
  constructor(...args: ConstructorParameters<typeof Map<K, V>>) {
    super(...args)
  }

  get(key: K): V {
    const value = super.get(key)
    if (!value) throw new Error(`Value not found for key: ${key}`)

    return value
  }
}

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
 */
export function toCsvDataRow(tenantNamesMap: SafeMap<string, string>, purpose: Purpose) {
  function getPurposeVersionWithState(state: PurposeState) {
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

  const state = activeVersion ? 'Attivo' : suspendedVersion ? 'Sospeso' : 'In attesa di attivazione'

  return {
    nome_comune: tenantNamesMap.get(purpose.consumerId),
    stato_finalita_migliore: state,
    data_attivazione: relevantVersion.firstActivationAt,
  }
}
