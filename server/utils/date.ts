export function addMonths(date: Date, months: number) {
  const result = new Date(date.getTime())
  result.setMonth(result.getMonth() + months)
  return result
}
