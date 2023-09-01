export function getVariationPercentage(oldValue: number, newValue: number) {
  const diff = newValue - oldValue
  return (diff / oldValue) * 100
}
