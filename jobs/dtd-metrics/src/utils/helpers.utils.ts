import { sub } from 'date-fns'

export function getSixMonthsAgoDate(): Date {
  return sub(new Date(), { months: 6 })
}

export function getOneYearAgoDate(): Date {
  return sub(new Date(), { years: 1 })
}
