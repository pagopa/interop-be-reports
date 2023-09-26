import {
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
} from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import {
  Top10MostSubscribedEServicesMetric,
  Top10MostSubscribedEServicesPerMacroCategoriesMetric,
} from '../models/metrics.model.js'
import { getMacroCategoryAttributesIds } from './macro-categories-attributes-ids.service.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3746
 */
export async function getTop10MostSubscribedEServicesPerMacroCategoriesMetric(
  readModel: ReadModelClient
): Promise<Top10MostSubscribedEServicesPerMacroCategoriesMetric> {
  async function getMacroCategoryTop10MostSubscribedEServices(
    macroCategory: (typeof MACRO_CATEGORIES)[number]
  ): Promise<Top10MostSubscribedEServicesPerMacroCategoriesMetric[number]> {
    const attributeIds = await getMacroCategoryAttributesIds(macroCategory, readModel)

    const result = await readModel.agreements
      .aggregate([
        {
          $match: {
            'data.state': {
              $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
            },
            'data.certifiedAttributes': {
              $elemMatch: { id: { $in: attributeIds } },
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
            _id: 0,
            name: { $arrayElemAt: ['$eservice.data.name', 0] },
            producerName: { $arrayElemAt: ['$producer.data.name', 0] },
            agreementsCount: 1,
          },
        },
      ])
      .toArray()

    return {
      id: macroCategory.id,
      name: macroCategory.name,
      top10MostSubscribedEServices: Top10MostSubscribedEServicesMetric.parse(result),
    }
  }

  const result = await Promise.all(
    MACRO_CATEGORIES.map((macroCategory) => getMacroCategoryTop10MostSubscribedEServices(macroCategory))
  )

  return Top10MostSubscribedEServicesPerMacroCategoriesMetric.parse(result)
}
