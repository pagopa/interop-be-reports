import { AthenaClientService } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'

export const getMostUsedEServicesMetric: MetricFactoryFn<'eServicePiuUtilizzati'> = async (_readModel, globalStore) => {
  const athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  const monthsAgo = getMonthsAgoDate(6)

  const { ResultSet } = await athena.query(
    `
    SELECT
      eserviceId,
      organizationId,
      count(*) as tokens
    FROM
      ${env.ATHENA_TOKENS_TABLE_NAME}
    WHERE
      issuedAt >= ${monthsAgo.getTime()}
    GROUP BY
      eserviceId,
      organizationId
    ORDER BY
      tokens DESC
    `
  )

  const Results = z.array(z.object({ eserviceId: z.string(), consumerId: z.string() }))

  const results = Results.parse(
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

  const mostUsedEServices = Object.entries(aggregatedResults).map(([eserviceId, consumers]) => ({
    eserviceId,
    consumers: Array.from(consumers).map((id) => [id, globalStore.getMacroCategoryFromTenantId(id)?.name]),
  }))

  return mostUsedEServices
}
