import { ATTRIBUTES_COLLECTION_NAME, EServiceDescriptor, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { EServicesByMacroCategoriesMetric } from '../models/metrics.model.js'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3745
 */
export const getEServicesByMacroCategoriesMetric: MetricFactoryFn<'eservicesByMacroCategories'> = async (readModel) => {
  async function getMacroCategoryPublishedEServiceCount(
    macroCategory: (typeof MACRO_CATEGORIES)[number]
  ): Promise<EServicesByMacroCategoriesMetric[number]> {
    const result = await readModel.eservices
      .aggregate([
        {
          $match: {
            'data.descriptors.state': {
              $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
            },
          },
        },
        { $replaceRoot: { newRoot: '$data' } },
        {
          $project: {
            _id: 0,
            id: 1,
            producerId: 1,
          },
        },
        {
          $lookup: {
            from: TENANTS_COLLECTION_NAME,
            localField: 'producerId',
            foreignField: 'data.id',
            as: 'producer',
          },
        },
        {
          $lookup: {
            from: ATTRIBUTES_COLLECTION_NAME,
            localField: 'producer.data.attributes.id',
            foreignField: 'data.id',
            as: 'producerAttributes',
          },
        },
        {
          $project: {
            codes: {
              $map: {
                input: '$producerAttributes',
                as: 'attr',
                in: '$$attr.data.code',
              },
            },
          },
        },
        {
          $group: {
            _id: 0,
            result: {
              $sum: {
                $cond: [
                  {
                    $or: macroCategory.ipaCodes.map((code) => ({
                      $in: [code, '$codes'],
                    })),
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            result: 1,
          },
        },
      ])
      .toArray()

    return {
      id: macroCategory.id,
      name: macroCategory.name,
      count: result[0]?.result ?? 0,
    }
  }

  const result = await Promise.all(
    MACRO_CATEGORIES.map((macroCategory) => getMacroCategoryPublishedEServiceCount(macroCategory))
  )

  return EServicesByMacroCategoriesMetric.parse(result)
}
