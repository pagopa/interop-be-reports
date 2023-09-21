// Note: the function works on UTC timezone
export function filenameFromDate(prefix: string, date: Date): string {
  const year = (date.getFullYear()).toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = (date.getDate()).toString().padStart(2, '0')

  return `${prefix}-${year}${month}${day}.csv`
}