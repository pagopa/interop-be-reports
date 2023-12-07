import { logInfo, logWarn, logError } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { sub } from 'date-fns'
import { json2csv as _json2csv } from 'json-2-csv'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, previous: number): number {
  return Number((previous === 0 ? 0 : ((current - previous) / previous) * 100).toFixed(1))
}

/**
 * Returns the tenants considered onboarded, i.e. the tenants that have an onboardedAt date
 */
export function getOnboardedTenants<TTenants extends { onboardedAt?: Date | undefined }>(
  tenants: Array<TTenants>
): Array<TTenants & { onboardedAt: Date }> {
  const isOnboarded = (tenant: TTenants): tenant is TTenants & { onboardedAt: Date } => !!tenant.onboardedAt
  return tenants.filter(isOnboarded)
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
