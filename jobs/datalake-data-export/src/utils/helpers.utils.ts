import { randomUUID } from 'crypto'
import { DataType } from '../models.js'
import format from 'date-fns/format'

/**
 * Get the path where to store the ndjson file
 */
export function getNdjsonBucketKey(dataType: DataType, date: Date): string {
  return format(date, `/${dataType}/yyyyMMdd/yyyyMMdd_HHmmss_${randomUUID()}.ndjson`)
}

/**
 * Split an array into chunks of a specific size
 */
export function splitArrayIntoChunks<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

/**
 * Convert an array to a ndjson string
 */
export function arrayToNdjson(array: unknown[]): string {
  return array.map((item) => JSON.stringify(item)).join('\n') + '\n'
}

export function addExportTimestampToData<T>(data: T[], exportTimestamp: Date): (T & { exportTimestamp: Date })[] {
  return data.map((item) => ({ ...item, exportTimestamp }))
}
