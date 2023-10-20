import { DescriptorState } from '../index.js'

/**
 * Converts an array of objects to CSV format.
 * If the array is empty, an empty string is returned.
 *
 * @param data - The array of objects to convert to CSV
 * @returns The CSV string
 */
export function toCSV(data: Array<Record<string, string | number>>): string {
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
export async function withExecutionTime(fn: () => void | Promise<void>): Promise<void> {
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
  b.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')

/**
 * Zip two arrays based on a matching key
 * Non-matching values are discarded.
 * Note: the key value must be unique in array b
 * @param a
 * @param b
 * @param getValueA Function that extracts the key for array a
 * @param getValueB Function that extracts the key for array b
 * @returns
 */
export function zipBy<A, B, K>(a: A[], b: B[], getValueA: (a: A) => K, getValueB: (b: B) => K): [A, B][] {
  const mapB = new Map<K, B>()

  b.forEach((bv) => mapB.set(getValueB(bv), bv))

  return a.map((av) => [av, mapB.get(getValueA(av))]).filter(([_, bv]) => bv !== undefined) as [A, B][]
}

/**
 * Gets the e-service active descriptor from an array of descriptors.
 * To get the active descriptor, we look for the first descriptor with state "Published" or "Suspended".
 * If there are more than one descriptor with the same state, we get the one with the higher version.
 * If there are no descriptors we return undefined.
 * @param descriptors - Array of descriptors
 * @returns The active descriptor or undefined in case it is not present
 */
export function getActiveDescriptor<TDescriptor extends { version: string; state: DescriptorState }>(
  descriptors: Array<TDescriptor>
): TDescriptor | undefined {
  let activeDescriptor: TDescriptor | undefined

  // Filter out all descriptors that are not published or suspended
  const activeDescriptors = descriptors.filter(({ state }) => state === 'Suspended' || state === 'Published')

  // If there are more than one descriptor, get the one with the higher version
  if (activeDescriptors.length > 1) {
    activeDescriptor = activeDescriptors.sort((a, b) => Number(b.version) - Number(a.version))[0]
  } else activeDescriptor = activeDescriptors[0]

  return activeDescriptor
}
