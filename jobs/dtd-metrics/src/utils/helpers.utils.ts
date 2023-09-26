export function getSixMonthsAgoDate(): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  return date
}

export function getOneYearAgoDate(): Date {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 1)
  return date
}
