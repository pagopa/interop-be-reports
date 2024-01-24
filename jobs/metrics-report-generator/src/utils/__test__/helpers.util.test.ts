import { getAllTenantsIdsFromAgreements } from '../helpers.util.js'

describe('helpers.util', () => {
  describe('getAllTenantsIdsFromAgreements', () => {
    it('should return unique array of tenants ids', () => {
      const agreements = [
        { consumerId: '1', producerId: '1' },
        { consumerId: '2', producerId: '2' },
        { consumerId: '3', producerId: '3' },
      ]
      const expected = ['1', '2', '3']
      const actual = getAllTenantsIdsFromAgreements(agreements)
      expect(actual).toEqual(expected)
    })

    it('should return unique array of tenants ids when there are duplicates', () => {
      const agreements = [
        { consumerId: '1', producerId: '2' },
        { consumerId: '1', producerId: '2' },
        { consumerId: '2', producerId: '3' },
      ]
      const expected = ['1', '2', '3']
      const actual = getAllTenantsIdsFromAgreements(agreements)
      expect(actual).toEqual(expected)
    })

    it('should return an empty array when there are no agreements', () => {
      const actual = getAllTenantsIdsFromAgreements([])
      expect(actual).toEqual([])
    })
  })
})
