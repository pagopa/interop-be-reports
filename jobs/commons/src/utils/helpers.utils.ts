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

/**
 * Encode a byte array to a url encoded base64 string, as specified in RFC 7515 Appendix C
 */
export const b64ByteUrlEncode = (b: Uint8Array): string => bufferB64UrlEncode(Buffer.from(b))

/**
 * Encode a string to a url encoded base64 string, as specified in RFC 7515 Appendix C
 */
export const b64UrlEncode = (str: string): string => bufferB64UrlEncode(Buffer.from(str, 'binary'))

const bufferB64UrlEncode = (b: Buffer): string =>
  b.toString('base64')
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")