import { SafeMap } from '@interop-be-reports/commons'
import { toCsvDataRow } from '../helpers.utils.js'
import { Purpose, Tenant } from '../../models/index.js'
import { PNDataCSVRow } from '../../models/pn-data-csv-row.model.js'

const tenantNamesMap = new SafeMap<string, Tenant>([
  ['tenantId', { id: 'id', name: 'tenantName', externalId: { origin: 'origin', value: 'value' } }],
])

describe('toCsvDataRow', () => {
  it('should return the correct data row (Active)', () => {
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Active',
          firstActivationAt: '2021-01-01',
          dailyCalls: 200,
        },
      ],
    }

    const expected: PNDataCSVRow = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'Attivo',
      data_attivazione: '2021-01-01',
      fonte_codice: 'origin',
      codice: 'value',
      carico_finalita_migliore: 200,
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should return the correct data row (Suspended)', () => {
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Suspended',
          firstActivationAt: '2021-01-01',
          dailyCalls: 200,
        },
      ],
    }
    const expected: PNDataCSVRow = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'Sospeso',
      data_attivazione: '2021-01-01',
      fonte_codice: 'origin',
      codice: 'value',
      carico_finalita_migliore: 200,
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should return the correct data row (WaitingForApproval)', () => {
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'WaitingForApproval',
          firstActivationAt: '2021-01-01',
          dailyCalls: 200,
        },
      ],
    }
    const expected: PNDataCSVRow = {
      nome_comune: 'tenantName',
      stato_finalita_migliore: 'In attesa di attivazione',
      data_attivazione: '2021-01-01',
      fonte_codice: 'origin',
      codice: 'value',
      carico_finalita_migliore: 200,
    }

    expect(toCsvDataRow(tenantNamesMap, purpose)).toEqual(expected)
  })

  it('should throw an error if the purpose has no active, suspended or waiting for activation version', () => {
    const purpose: Purpose = {
      id: 'id',
      consumerId: 'tenantId',
      versions: [
        {
          state: 'Archived',
          firstActivationAt: '2021-01-01',
          dailyCalls: 200,
        },
      ],
    }

    expect(() => toCsvDataRow(tenantNamesMap, purpose)).toThrow()
  })
})
