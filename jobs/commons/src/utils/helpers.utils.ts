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
 * Transforms an array of identifiable records into a `SafeMap`.
 * A `SafeMap` is an extended Map that throws an error if the key is not found.
 * Identifiable records are records that have an `id` property.
 *
 * @param records - The array of records
 * @returns The map of records
 * @example
 * const records = [{ id: "1", name: "John" }, { id: "2", name: "Jane" }];
 * const recordsMap = getMappedRecords(records);
 * console.log(recordsMap.get("1")); // { id: "1", name: "John" }
 * console.log(recordsMap.get("2")); // { id: "2", name: "Jane" }
 * console.log(recordsMap.get("3")); // throws an error
 */
export function getSafeMapFromIdentifiableRecords<T extends { id: string }>(
  records: Array<T>
): SafeMap<string, T> {
  return new SafeMap(records.map((record) => [record.id, record]))
}

/**
 * Calls a function and logs the execution time.
 * @param fn The function to call
 * @returns The result of the function
 */
export async function withExecutionTime(fn: () => void | Promise<void>) {
  const t0 = performance.now()
  await fn()
  const t1 = performance.now()
  const executionTimeMs = t1 - t0
  const executionTimeSeconds = Math.round((executionTimeMs / 1000) * 10) / 10
  console.log(`Execution time: ${executionTimeSeconds}s`)
}
