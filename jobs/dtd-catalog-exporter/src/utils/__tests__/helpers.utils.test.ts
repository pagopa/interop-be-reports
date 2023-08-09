import { SafeMap } from '@interop-be-reports/commons'
import { getSafeMapFromIdentifiableRecords } from '../helpers.utils.js'

describe('getSafeMapFromIdentifiableRecords', () => {
  it('should return a SafeMap from an array of identifiable records', () => {
    const identifiableRecords = [
      { id: 'id1', name: 'name1' },
      { id: 'id2', name: 'name2' },
    ]

    const expected = new SafeMap<string, { id: string; name: string }>([
      ['id1', { id: 'id1', name: 'name1' }],
      ['id2', { id: 'id2', name: 'name2' }],
    ])

    expect(getSafeMapFromIdentifiableRecords(identifiableRecords)).toEqual(expected)
  })
})
