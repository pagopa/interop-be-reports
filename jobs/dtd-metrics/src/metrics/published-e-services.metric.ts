import { EServiceDescriptor } from '@interop-be-reports/commons'
import { PublishedEServicesMetric } from '../models/metrics.model.js'
import { getMonthsAgoDate, getVariationPercentage, createMetric } from '../utils/helpers.utils.js'
import { Document } from 'mongodb'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3744
 **/
export const publishedEServicesMetric = createMetric('publishedEServices', async (readModel) => {
  const oneMonthAgoDate = getMonthsAgoDate(1)
  const twoMonthsAgoDate = getMonthsAgoDate(2)

  const publishedEServiceFilter: Document = {
    'data.descriptors.state': {
      $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
    },
  }

  const publishedEServicesCountPromise = readModel.eservices.countDocuments(publishedEServiceFilter)

  const lastMonthPublishedEServicesCountPromise = readModel.eservices.countDocuments({
    ...publishedEServiceFilter,
    'data.descriptors': {
      $elemMatch: {
        version: '1',
        publishedAt: {
          $gte: oneMonthAgoDate.toISOString(),
        },
      },
    },
  })

  const twoMonthsAgoPublishedEServicesCountPromise = readModel.eservices.countDocuments({
    ...publishedEServiceFilter,
    'data.descriptors': {
      $elemMatch: {
        version: '1',
        publishedAt: {
          $lte: oneMonthAgoDate.toISOString(),
          $gte: twoMonthsAgoDate.toISOString(),
        },
      },
    },
  })

  const [count, lastMonthCount, twoMonthsAgoPublishedEServicesCount] = await Promise.all([
    publishedEServicesCountPromise,
    lastMonthPublishedEServicesCountPromise,
    twoMonthsAgoPublishedEServicesCountPromise,
  ])

  const variation = getVariationPercentage(lastMonthCount, twoMonthsAgoPublishedEServicesCount)

  return PublishedEServicesMetric.parse({ count, lastMonthCount, variation })
})
