import { SafeMap } from '@interop-be-reports/commons'
import { toCsvDataRow } from '../helpers.utils.js'
import { Purpose } from '../../models/index.js'

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
