import { AthenaClientService, ReadModelClient, SafeMap } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import { GlobalStoreService } from '../services/global-store.service.js'
import { MostUsedEServicesMetric } from '../models/metrics.model.js'

export const getMostUsedEServicesMetric: MetricFactoryFn<'eServicePiuUtilizzati'> = async (readModel, globalStore) => {
  const athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  return {
    lastSixMonths: await getMostUsedEServicesPerMacroCategory(athena, globalStore, readModel, sixMonthsAgoDate),
    lastTwelveMonths: await getMostUsedEServicesPerMacroCategory(athena, globalStore, readModel, twelveMonthsAgoDate),
    fromTheBeginning: await getMostUsedEServicesPerMacroCategory(athena, globalStore, readModel, fromTheBeginningDate),
  }
}

async function getMostUsedEServicesPerMacroCategory(
  athena: AthenaClientService,
  globalStore: GlobalStoreService,
  readModel: ReadModelClient,
  date?: Date
): Promise<MostUsedEServicesMetric[keyof MostUsedEServicesMetric]> {
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

  const eservicesMap = await getEServicesMap(
    readModel,
    results.map((r) => r.eserviceId)
  )

  function generateMostUsedEServices(
    tenantsIds: Array<string>
  ): MostUsedEServicesMetric[keyof MostUsedEServicesMetric][number]['data'] {
    // Aggregate results to a map of eserviceId -> Set<consumerId>
    const aggregatedResults = results.reduce<Record<string, Set<string>>>((acc, { eserviceId, consumerId }) => {
      if (!tenantsIds.includes(consumerId)) return acc

      if (!acc[eserviceId]) {
        acc[eserviceId] = new Set<string>()
      }
      acc[eserviceId].add(consumerId)
      return acc
    }, {})

    // Map aggregated results to an array of objects, one for each eservice
    return Object.entries(aggregatedResults)
      .map(([eserviceId, activeConsumers]) => {
        const eservice = eservicesMap.get(eserviceId)
        const producerName = globalStore.getTenantFromId(eservice?.producerId)?.name

        if (!eservice || !producerName) {
          throw new Error(`EService or producer not found for id ${eserviceId}`)
        }

        // For each eservice, count the number of active consumers and group them by macro category
        const activeConsumersByMacroCategory = Array.from(activeConsumers)
          // Get the macro category of each consumer
          .map((consumerId) => globalStore.getMacroCategoryFromTenantId(consumerId))
          // Some consumers may not have a macro category, filter them out
          .filter(Boolean)
          // Count the number of consumers for each macro category
          .reduce<{ macroCategoryName: string; count: number }[]>((acc, macroCategory) => {
            const existing = acc.find((c) => c.macroCategoryName === macroCategory?.name)
            if (existing) {
              existing.count++
            } else {
              acc.push({ macroCategoryName: macroCategory?.name ?? 'Unknown', count: 1 })
            }
            return acc
          }, [])
          .sort((a, b) => b.count - a.count)

        const totalActiveConsumers = activeConsumersByMacroCategory.reduce((acc, { count }) => acc + count, 0)
        return {
          eserviceName: eservice.name,
          producerName,
          totalActiveConsumers,
          activeConsumersByMacroCategory,
        }
      })
      .sort((a, b) => b.totalActiveConsumers - a.totalActiveConsumers)
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
