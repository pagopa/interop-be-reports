import {
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
} from '@interop-be-reports/commons'
import { Top10MostSubscribedEServicesMetric } from '../models/metrics.model.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3746
 */
export async function getTop10MostSubscribedEServicesMetric(
  readModel: ReadModelClient
): Promise<Top10MostSubscribedEServicesMetric> {
  const result = await readModel.agreements
    .aggregate([
      {
        $match: {
          'data.state': {
            $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
          },
        },
      },
      {
        $group: {
          _id: { eserviceId: '$data.eserviceId', producerId: '$data.producerId' },
          agreementsCount: { $sum: 1 },
        },
      },
      { $sort: { agreementsCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: ESERVICES_COLLECTION_NAME,
          localField: '_id.eserviceId',
          foreignField: 'data.id',
          as: 'eservice',
        },
      },
      {
        $lookup: {
          from: TENANTS_COLLECTION_NAME,
          localField: '_id.producerId',
          foreignField: 'data.id',
          as: 'producer',
        },
      },
      {
        $project: {
          name: {
            $arrayElemAt: ['$eservice.data.name', 0],
          },
          producerName: {
            $arrayElemAt: ['$producer.data.name', 0],
          },
          agreementsCount: 1,
        },
      },
    ])
    .toArray()

  return Top10MostSubscribedEServicesMetric.parse(result)
}
