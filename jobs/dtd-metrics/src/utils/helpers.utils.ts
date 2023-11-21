import { logInfo, logWarn, logError } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { sub } from 'date-fns'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, previous: number): number {
  return Number((previous === 0 ? 0 : ((current - previous) / previous) * 100).toFixed(1))
}

const cidJob = randomUUID()

export const log = {
  info: logInfo.bind(null, cidJob),
  warn: logWarn.bind(null, cidJob),
  error: logError.bind(null, cidJob),
}
