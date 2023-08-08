import { Purpose } from '../models/purposes.models'
import { SafeMap, toCSV, toCsvDataRow } from '../utils/helpers.utils'

describe('toCSV', () => {
  it('should return a CSV string from an array of objects', () => {
    const data = [
      { name: 'John', surname: 'Doe' },
      { name: 'Jane', surname: 'Doe' },
    ]

    const expected = 'name,surname\nJohn,Doe\nJane,Doe'

    expect(toCSV(data)).toEqual(expected)
  })

  it('should return an empty string if the array is empty', () => {
    expect(toCSV([])).toEqual('')
  })
})

describe('SafeMap', () => {
  it('should throw an error if the key is not found', () => {
    const map = new Map<string, string>([['key', 'value']])
    const safeMap = new SafeMap(map)

    expect(() => safeMap.get('key')).not.toThrow()
    expect(() => safeMap.get('wrongKey')).toThrow()
  })
})

describe('toCsvDataRow', () => {
  it('should return the correct data row (Active)', () => {
    const tenantNamesMap = new SafeMap<string, string>([['tenantId', 'tenantName']])
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Active',
          firstActivationAt: '2021-01-01',
        },
      ],
    }
    const expected = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'Attivo',
      data_attivazione: '2021-01-01',
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should return the correct data row (Suspended)', () => {
    const tenantNamesMap = new SafeMap<string, string>([['tenantId', 'tenantName']])
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Suspended',
          firstActivationAt: '2021-01-01',
        },
      ],
    }
    const expected = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'Sospeso',
      data_attivazione: '2021-01-01',
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should return the correct data row (WaitingForApproval)', () => {
    const tenantNamesMap = new SafeMap<string, string>([['tenantId', 'tenantName']])
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'WaitingForApproval',
          firstActivationAt: '2021-01-01',
        },
      ],
    }
    const expected = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'In attesa di attivazione',
      data_attivazione: '2021-01-01',
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should throw an error if the purpose has no active, suspended or waiting for activation version', () => {
    const tenantNamesMap = new SafeMap<string, string>([['tenantId', 'tenantName']])
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Archived',
          firstActivationAt: '2021-01-01',
        },
      ],
    }

    expect(() => toCsvDataRow(tenantNamesMap, purpose)).toThrow()
  })
})
