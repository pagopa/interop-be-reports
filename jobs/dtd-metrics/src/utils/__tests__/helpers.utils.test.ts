import { getOnboardedTenants, json2csv, splitArrayIntoChunks, toSnakeCase } from '../helpers.utils.js'

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

describe('splitArrayIntoChunks', () => {
  it('should return the correct chunks', () => {
    const array = [1, 2, 3, 4, 5, 6, 7]
    const chunkSize = 3
    const chunks = splitArrayIntoChunks(array, chunkSize)
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]])
  })

  it('should throw an error if the chunk size is invalid', () => {
    const array = [1, 2, 3, 4, 5, 6, 7]
    const chunkSize = 0
    expect(() => splitArrayIntoChunks(array, chunkSize)).toThrowError()
  })
})
