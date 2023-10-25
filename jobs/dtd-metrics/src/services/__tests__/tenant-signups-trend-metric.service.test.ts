import { getTenantMock } from '@interop-be-reports/commons'
import { randomUUID } from 'crypto'
import { MacroCategoryCodeFor, MacroCategoryName, readModelMock, seedCollection } from '../../utils/tests.utils.js'
import { sub } from 'date-fns'
import { getTenantSignupsTrendMetric } from '../tenant-signups-trend-metric.service.js'

const comuneAttributeUuid = randomUUID()
const aziendaOspedalieraAttributeUuid = randomUUID()

const oneMonthAgoDate = sub(new Date(), { months: 1 }).toISOString()
const sixMonthsAgoDate = sub(new Date(), { months: 6 }).toISOString()
const oneYearAgoDate = sub(new Date(), { years: 1 }).toISOString()

describe('getTenantSignupsTrendMetric', () => {
  it('should return the correct metrics', async () => {
    const oboardedTenants = [
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: oneMonthAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: sixMonthsAgoDate,
          attributes: [{ id: comuneAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: sixMonthsAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: oneYearAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
      {
        data: getTenantMock({
          selfcareId: 'selfcareId',
          createdAt: oneYearAgoDate,
          attributes: [{ id: aziendaOspedalieraAttributeUuid }],
        }),
      },
    ]

    const attributes = [
      { data: { id: comuneAttributeUuid, code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'> } },
      {
        data: {
          id: aziendaOspedalieraAttributeUuid,
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        },
      },
    ]

    await seedCollection('tenants', oboardedTenants)
    await seedCollection('attributes', attributes)

    const result = await getTenantSignupsTrendMetric(readModelMock)

    const comuniMetric = result.fromTheBeginning.find(
      (metric) => metric.name === ('Comuni e città metropolitane' satisfies MacroCategoryName)
    )

    const aziendeOspedaliereMetric = result.fromTheBeginning.find(
      (metric) => metric.name === ('Aziende Ospedaliere e ASL' satisfies MacroCategoryName)
    )

    expect(comuniMetric?.data[comuniMetric?.data.length - 1].count).toBe(3)
    expect(aziendeOspedaliereMetric?.data[aziendeOspedaliereMetric?.data.length - 1].count).toBe(3)
  })
})
