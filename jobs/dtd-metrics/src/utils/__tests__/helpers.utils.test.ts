import { getOnboardedTenants, getVariationPercentage, json2csv, toSnakeCase } from '../helpers.utils.js'

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
    const todayDate = new Date()
    const tenants = [
      { onboardedAt: todayDate },
      { onboardedAt: todayDate },
      { onboardedAt: todayDate },
      { onboardedAt: undefined },
      { onboardedAt: todayDate },
    ]
    expect(getOnboardedTenants(tenants)).toEqual([
      { onboardedAt: todayDate },
      { onboardedAt: todayDate },
      { onboardedAt: todayDate },
      { onboardedAt: todayDate },
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

describe('json2csv', () => {
  it('should return the correct csv', () => {
    const data = [
      { foo: 'bar', baz: 'qux' },
      { foo: 'bar2', baz: 'qux2' },
    ]
    expect(json2csv(data)).toBe('foo,baz\nbar,qux\nbar2,qux2')
  })

  it('should return the correct csv with nested objects', () => {
    const data = [
      { foo: 'bar', baz: { qux: 'quux' } },
      { foo: 'bar2', baz: { qux: 'quux2' } },
    ]
    expect(json2csv(data)).toBe('foo,qux\nbar,quux\nbar2,quux2')
  })
})
