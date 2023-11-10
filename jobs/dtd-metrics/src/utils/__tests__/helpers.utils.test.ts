import { getVariationPercentage } from '../helpers.utils.js'

describe('getVariationPercentage', () => {
  it('should return the correct variation', () => {
    expect(getVariationPercentage(10, 5)).toBe(100)
    expect(getVariationPercentage(10, 0)).toBe(0)
    expect(getVariationPercentage(10, 10)).toBe(0)
    expect(getVariationPercentage(10, 15)).toBe(-33.3)
  })
})
