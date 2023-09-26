import { EServiceDescriptor, ReadModelClient } from '@interop-be-reports/commons'
import { getVariationPercentage } from '../utils/helpers.utils.js'
import { Metrics, PublishedEServicesMetric } from '../models/metrics.model.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3744
 **/
export async function getPublishedEServicesMetric(
  oldMetrics: Metrics | undefined,
  readModel: ReadModelClient
): Promise<PublishedEServicesMetric> {
  const publishedEServicesCount = await readModel.eservices.countDocuments({
    'data.descriptors.state': {
      $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
    },
  })

  let variation = 0

  if (oldMetrics) {
    variation = getVariationPercentage(
      oldMetrics.publishedEServicesMetric.publishedEServicesCount,
      publishedEServicesCount
    )
  }

  return PublishedEServicesMetric.parse({
    publishedEServicesCount,
    variation: new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(variation),
  })
}
