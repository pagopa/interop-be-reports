import { logInfo, logWarn, logError } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { sub } from 'date-fns'
import { json2csv as _json2csv } from 'json-2-csv'
import { TokensByDay } from '../services/tokens-store.service.js'

export function getMonthsAgoDate(numMonths: number): Date {
  const result = sub(new Date(), { months: numMonths })
  result.setHours(0, 0, 0, 0)
  return result
}

export function getVariationPercentage(variation: number, current: number): number {
  const previous = current - variation
  if (previous === 0) return 0
  const percentage = ((current - previous) / previous) * 100
  return Number(percentage.toFixed(1))
}

const cidJob = randomUUID()
export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}

export const timer = {
  timeStart: 0,
  start(): void {
    this.timeStart = performance.now()
  },
  stop(): number {
    const timeEnd = performance.now()
    return Number(((timeEnd - this.timeStart) / 1000).toFixed(2))
  },
}

export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

export function json2csv(data: object[]): string {
  const csv = _json2csv(data, {
    unwindArrays: true,
  })

  const header = csv.split('\n')[0]
  const records = csv.split('\n').slice(1)

  // `unwindArrays` option will create a header with the full path of the field
  // e.g. "data.lastSixMonths.0.count" instead of "count".
  // We only want the last part of the path
  const newHeader = header
    .split(',')
    .map((field) => field.split('.').slice(-1)[0])
    .join(',')

  return [newHeader, ...records].join('\n')
}

export function aggregateTokensCount(tokensByDay: TokensByDay): number {
  return tokensByDay.reduce((acc, { tokens }) => acc + tokens, 0)
}

export function getOldestDate(data: Array<Date>): Date {
  const oldestDate = data.reduce((oldestDate, date) => {
    if (date < oldestDate) {
      return date
    }
    return oldestDate
  }, new Date())
  oldestDate.setHours(0, 0, 0, 0)
  return oldestDate
}

/**
 * Converts a list of dates into a timeseries sequence data.
 * @param oldestDate The oldest date in the list, which will be used as the starting point for the timeseries
 * @param jump The jump between each data point
 * @param data The list of dates
 */
export function toTimeseriesSequenceData({
  oldestDate,
  jump,
  data,
}: {
  oldestDate: Date
  jump: Duration
  data: Array<Date>
}): Array<{ date: Date; count: number }> {
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  let currentCount: number = data.length
  const timeseriesData: Array<{ date: Date; count: number }> = [{ date: currentDate, count: currentCount }]

  while (oldestDate < currentDate) {
    // Jump to the next date
    currentDate = sub(currentDate, jump)
    currentDate.setHours(0, 0, 0, 0)
    // Count the number of dates that are less than or equal to the current date, and add it to the timeseries data
    currentCount = data.filter((date) => date <= currentDate).length

    timeseriesData.push({ date: currentDate, count: currentCount })
  }
  // Reverse the timeseries data so that the oldest date is first
  return timeseriesData.reverse()
}
