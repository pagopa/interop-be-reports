export function getVariationPercentage(oldValue: number, newValue: number): number {
  const diff = newValue - oldValue
  return (diff / oldValue) * 100
}
