import { AthenaClientService, ReadModelClient, SafeMap } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import { GlobalStoreService } from '../services/global-store.service.js'

export const getMostUsedEServicesMetric: MetricFactoryFn<'eServicePiuUtilizzati'> = async (readModel, globalStore) => {
  const athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  return {
    sixMonthsAgo: await getMostUsedEServices(athena, globalStore, readModel, sixMonthsAgoDate),
    twelveMonthsAgo: await getMostUsedEServices(athena, globalStore, readModel, twelveMonthsAgoDate),
    fromTheBeginning: await getMostUsedEServices(athena, globalStore, readModel, fromTheBeginningDate),
  }
}

async function getMostUsedEServices(
  athena: AthenaClientService,
  globalStore: GlobalStoreService,
  readModel: ReadModelClient,
  date?: Date
): Promise<unknown> {
  const { ResultSet } = await athena.query(
    `
    SELECT
      eserviceId,
      organizationId,
      count(*) as tokens
    FROM
      ${env.ATHENA_TOKENS_TABLE_NAME}
    ${date ? `WHERE issuedAt >= ${date.getTime()}` : ''}
    GROUP BY
      eserviceId,
      organizationId
    ORDER BY
      tokens DESC
    `
  )

  const results = z.array(z.object({ eserviceId: z.string(), consumerId: z.string() })).parse(
    ResultSet?.Rows?.slice(1).map((row) => ({
      eserviceId: row.Data?.[0].VarCharValue,
      consumerId: row.Data?.[1].VarCharValue,
    }))
  )

  const aggregatedResults = results.reduce<Record<string, Set<string>>>((acc, { eserviceId, consumerId }) => {
    if (!acc[eserviceId]) {
      acc[eserviceId] = new Set<string>()
    }
    acc[eserviceId].add(consumerId)
    return acc
  }, {})

  const eservicesMap = await getEServicesMap(readModel, Object.keys(aggregatedResults))

  return Object.entries(aggregatedResults).map(([eserviceId, activeConsumers]) => {
    const eservice = eservicesMap.get(eserviceId)
    const producerName = globalStore.getTenantFromId(eservice?.producerId)?.name
    const totalActiveConsumers = activeConsumers.size
    const activeConsumersByMacroCategory = Array.from(activeConsumers)
      .map((consumerId) => globalStore.getMacroCategoryFromTenantId(consumerId))
      .filter(Boolean)
      .reduce<{ macroCategoryName: string; count: number }[]>((acc, macroCategory) => {
        const existing = acc.find((c) => c.macroCategoryName === macroCategory?.name)
        if (existing) {
          existing.count++
        } else {
          acc.push({ macroCategoryName: macroCategory?.name ?? 'Unknown', count: 1 })
        }
        return acc
      }, [])
    return {
      name: eservice.name,
      producerName,  
      totalActiveConsumers,
      activeConsumersByMacroCategory,
    }
  })
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
