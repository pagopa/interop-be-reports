import { EServiceDescriptor, ReadModelClient } from '@interop-be-reports/commons'
import { PublishedEServicesMetric } from '../models/metrics.model.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3744
 **/
export async function getPublishedEServicesMetric(readModel: ReadModelClient): Promise<PublishedEServicesMetric> {
  const publishedEServicesCount = await readModel.eservices.countDocuments({
    'data.descriptors.state': {
      $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
    },
  })

  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const lastMonthPublishedEServicesCount = await readModel.eservices.countDocuments({
    'data.descriptors.state': {
      $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
    },
    // QUESTION: Is it correct to assume that the version 1 descriptor of the e-service is always at index 0?
    'data.descriptors.0.publishedAt': {
      $gte: oneMonthAgo.toISOString(),
    },
  })

  const variation = (lastMonthPublishedEServicesCount / publishedEServicesCount) * 100

  return PublishedEServicesMetric.parse({
    publishedEServicesCount,
    lastMonthPublishedEServicesCount,
    variation: Number(variation.toFixed(1)),
  })
}
