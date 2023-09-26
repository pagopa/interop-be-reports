import sub from 'date-fns/sub'

export function getSixMonthsAgoDate(): Date {
  return sub(new Date(), { months: 6 })
}

export function getTwelveYearAgoDate(): Date {
  return sub(new Date(), { years: 1 })
}
