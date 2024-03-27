import { AthenaClientService, ReadModelClient, SafeMap } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import { GlobalStoreService } from '../services/global-store.service.js'
import { EServicesWithMostTokensMetric } from '../models/metrics.model.js'

export const getEServicesWithMostTokensMetric: MetricFactoryFn<'eserviceConPiuTokenStaccati'> = async (
  readModel,
  globalStore
) => {
  const athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  return {
    lastSixMonths: await getEServicesWithMostTokens(athena, globalStore, readModel, sixMonthsAgoDate),
    lastTwelveMonths: await getEServicesWithMostTokens(athena, globalStore, readModel, twelveMonthsAgoDate),
    fromTheBeginning: await getEServicesWithMostTokens(athena, globalStore, readModel, fromTheBeginningDate),
  }
}

async function getEServicesWithMostTokens(
  athena: AthenaClientService,
  globalStore: GlobalStoreService,
  readModel: ReadModelClient,
  date?: Date
): Promise<EServicesWithMostTokensMetric[keyof EServicesWithMostTokensMetric]> {
  const { ResultSet } = await athena.query(
    `
    SELECT
      eserviceId,
      organizationId,
      count(*) as tokens
    FROM 
      ${env.ATHENA_TOKENS_TABLE_NAME}
      ${date ? `WHERE issuedAt >=${date.getTime()}` : ''}
    GROUP BY
      eserviceId,
      organizationId
    `
  )

  const results = z
    .array(z.object({ eserviceId: z.string(), consumerId: z.string(), tokens: z.coerce.number() }))
    .parse(
      ResultSet?.Rows?.slice(1).map((row) => ({
        eserviceId: row.Data?.[0].VarCharValue,
        consumerId: row.Data?.[1].VarCharValue,
        tokens: row.Data?.[2].VarCharValue,
      }))
    )

  const eservicesMap = await getEServicesMap(
    readModel,
    results.map((r) => r.eserviceId)
  )

  function generateMostUsedEServices(
    tenantsIds: Array<string>
  ): EServicesWithMostTokensMetric[keyof EServicesWithMostTokensMetric][number]['data'] {
    return Object.values(
      results
        .filter((r) => tenantsIds.includes(r.consumerId))
        .reduce<
          Record<string, EServicesWithMostTokensMetric[keyof EServicesWithMostTokensMetric][number]['data'][number]>
        >((acc, r) => {
          const eservice = eservicesMap.get(r.eserviceId)
          const producer = globalStore.tenantsMap.get(eservice?.producerId)
          if (!eservice || !producer) return acc
          if (!acc[eservice.id]) {
            acc[eservice.id] = {
              eserviceId: eservice.id,
              eserviceName: eservice.name,
              producerName: producer.name,
              tokenCount: 0,
            }
          }
          acc[eservice.id].tokenCount += r.tokens
          return acc
        }, {})
    )
      .sort((a, b) => b.tokenCount - a.tokenCount)
      .slice(0, 10)
  }

  const macroCategoryData = [
    { id: '0', name: 'Totale', tenantsIds: globalStore.tenants.map((t) => t.id) },
    ...globalStore.macroCategories,
  ]

  return macroCategoryData.map((macroCategory) => ({
    id: macroCategory.id,
    name: macroCategory.name,
    data: generateMostUsedEServices(macroCategory.tenantsIds),
  }))
}

const EService = z.object({ id: z.string(), name: z.string(), producerId: z.string() })
type EService = z.infer<typeof EService>

async function getEServicesMap(
  readModel: ReadModelClient,
  eserviceIds: Array<string>
): Promise<SafeMap<string, EService>> {
  const eservices = await readModel.eservices
    .find({ 'data.id': { $in: eserviceIds } })
    .map(({ data }) => EService.parse(data))
    .toArray()

  return new SafeMap(eservices.map((eservice) => [eservice.id, eservice]))
}
