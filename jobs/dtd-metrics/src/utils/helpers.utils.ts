import { sub } from 'date-fns'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, previous: number): number {
  return Number((previous === 0 ? 0 : ((current - previous) / previous) * 100).toFixed(1))
}

export async function wrapPromiseWithLogs<T>(promise: Promise<T>, name: string): Promise<T> {
  console.log(`> Starting ${name}...`)

  const timeLog = `> Done! ${name} finished executing in`
  console.time(timeLog)

  try {
    const result = await promise
    console.timeEnd(timeLog)
    return result
  } catch (e) {
    console.error(`Error while executing ${name}`)
    throw e
  }
}
