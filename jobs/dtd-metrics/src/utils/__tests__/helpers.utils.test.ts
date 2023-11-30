import { getOnboardedTenants, getVariationPercentage, toSnakeCase } from '../helpers.utils.js'

describe('getVariationPercentage', () => {
  it('should return the correct variation', () => {
    expect(getVariationPercentage(10, 5)).toBe(100)
    expect(getVariationPercentage(10, 0)).toBe(0)
    expect(getVariationPercentage(10, 10)).toBe(0)
    expect(getVariationPercentage(10, 15)).toBe(-33.3)
  })
})

describe('getOnboardedTenants', () => {
  it('should return the correct onboarded tenants', () => {
    const tenants = [
      { selfcareId: '1' },
      { selfcareId: '2' },
      { selfcareId: '3' },
      { selfcareId: undefined },
      { selfcareId: '5' },
    ]
    expect(getOnboardedTenants(tenants)).toEqual([
      { selfcareId: '1' },
      { selfcareId: '2' },
      { selfcareId: '3' },
      { selfcareId: '5' },
    ])
  })
})

describe('toSnakeCase', () => {
  it('should return the correct snake case string', () => {
    expect(toSnakeCase('fooBar')).toBe('foo_bar')
    expect(toSnakeCase('fooBarBaz')).toBe('foo_bar_baz')
    expect(toSnakeCase('foo')).toBe('foo')
  })
})
