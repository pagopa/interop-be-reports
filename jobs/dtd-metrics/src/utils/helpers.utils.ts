import { logInfo, logWarn, logError } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { sub } from 'date-fns'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, previous: number): number {
  return Number((previous === 0 ? 0 : ((current - previous) / previous) * 100).toFixed(1))
}

/**
 * Returns the tenants considered onboarded, i.e. the tenants that have a selfcareId.
 */
export function getOnboardedTenants<TTenants extends { selfcareId?: string | undefined }>(
  tenants: Array<TTenants>
): Array<TTenants> {
  return tenants.filter(({ selfcareId }) => !!selfcareId)
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
