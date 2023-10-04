import {
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
} from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { Top10MostSubscribedEServices, Top10MostSubscribedEServicesMetric } from '../models/metrics.model.js'
import { getSixMonthsAgoDate, getOneYearAgoDate, getAttributesIdsFromIpaCodes } from '../utils/helpers.utils.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3746
 */
export async function getTop10MostSubscribedEServicesMetric(
  readModel: ReadModelClient
): Promise<Top10MostSubscribedEServicesMetric> {
  const result = await Promise.all(
    [{ id: '0', name: 'Totale' }, ...MACRO_CATEGORIES].map((macroCategory) =>
      getTop10MostSubscribedEServices(macroCategory, readModel)
    )
  )

  return Top10MostSubscribedEServicesMetric.parse(result)
}

async function getTop10MostSubscribedEServices(
  macroCategory: { id: string; name: string; ipaCodes?: ReadonlyArray<string> },
  readModel: ReadModelClient
): Promise<Top10MostSubscribedEServicesMetric[number]> {
  const attributeIds = macroCategory.ipaCodes && (await getAttributesIdsFromIpaCodes(macroCategory.ipaCodes, readModel))

  const sixMonthsAgoDate = getSixMonthsAgoDate()
  const twelveYearAgoDate = getOneYearAgoDate()
  const fromTheBeginningDate = undefined

  const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = await Promise.all(
    [sixMonthsAgoDate, twelveYearAgoDate, fromTheBeginningDate].map((date) =>
      readModel.agreements
        .aggregate([
          {
            $match: {
              'data.state': {
                $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
              },
              ...(attributeIds
                ? {
                    'data.certifiedAttributes': {
                      $elemMatch: { id: { $in: attributeIds } },
                    },
                  }
                : {}),
              ...(date ? { 'data.createdAt': { $gte: date.toISOString() } } : {}),
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
    )
  )

  return {
    id: macroCategory.id,
    name: macroCategory.name,
    top10MostSubscribedEServices: Top10MostSubscribedEServices.parse({
      lastSixMonths,
      lastTwelveMonths,
      fromTheBeginning,
    }),
  }
}
