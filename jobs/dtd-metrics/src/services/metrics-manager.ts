import { MongoClient } from 'mongodb'
import { env } from '../configs/env.js'
import {
  Agreement,
  AgreementState,
  Attribute,
  EService,
  EServiceDescriptor,
} from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import {
  MacroCategoriesPublishedEServicesMetric,
  Metrics,
  PublishedEServicesMetric,
  Top10MostSubscribedEServicesMetric,
  Top10MostSubscribedEServicesPerMacroCategoryMetric,
  Top10ProviderWithMostSubscriberMetric,
} from '../models/metrics.model.js'
import { getVariationPercentage } from '../utils/helpers.utils.js'

export class MetricsManager {
  constructor(private client: MongoClient) {}

  /**
   * @see https://pagopa.atlassian.net/browse/PIN-3744
   **/
  async getPublishedEServicesMetric(
    oldMetrics: Metrics | undefined
  ): Promise<PublishedEServicesMetric> {
    const publishedEServicesCount = await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: EService }>(env.ESERVICES_COLLECTION_NAME)
      .countDocuments({
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

  /**
   * @see https://pagopa.atlassian.net/browse/PIN-3745
   */
  async getMacroCategoriesPublishedEServicesMetric(): Promise<MacroCategoriesPublishedEServicesMetric> {
    const result = await Promise.all(
      MACRO_CATEGORIES.map((macroCategory) =>
        this.getMacroCategoryPublishedEServiceCount(macroCategory)
      )
    )
    return MacroCategoriesPublishedEServicesMetric.parse(result)
  }

  /**
   * @see https://pagopa.atlassian.net/browse/PIN-3746
   */
  async getTop10MostSubscribedEServicesMetric(): Promise<Top10MostSubscribedEServicesMetric> {
    const result = await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: EService }>(env.ESERVICES_COLLECTION_NAME)
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
          $lookup: {
            from: env.AGREEMENTS_COLLECTION_NAME,
            localField: 'id',
            foreignField: 'data.eserviceId',
            as: 'agreements',
          },
        },
        {
          $lookup: {
            from: env.TENANTS_COLLECTION_NAME,
            localField: 'producerId',
            foreignField: 'data.id',
            as: 'producer',
          },
        },
        {
          $project: {
            name: 1,
            producerName: {
              $arrayElemAt: ['$producer.data.name', 0],
            },
            agreementsCount: {
              $size: {
                $filter: {
                  input: '$agreements',
                  cond: {
                    $or: [
                      { $eq: ['$$this.data.state', 'Active'] },
                      { $eq: ['$$this.data.state', 'Suspended'] },
                    ],
                  },
                },
              },
            },
          },
        },
        { $sort: { agreementsCount: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    return Top10MostSubscribedEServicesMetric.parse(result)
  }

  /**
   * @see https://pagopa.atlassian.net/browse/PIN-3746
   */
  async getTop10MostSubscribedEServicesPerMacroCategoryMetric(): Promise<Top10MostSubscribedEServicesPerMacroCategoryMetric> {
    const result = await Promise.all(
      MACRO_CATEGORIES.map((macroCategory) =>
        this.getMacroCategoryTop10MostSubscribedEServices(macroCategory)
      )
    )

    return Top10MostSubscribedEServicesPerMacroCategoryMetric.parse(result)
  }

  /**
   * @see https://pagopa.atlassian.net/browse/PIN-3747
   */
  async getTop10ProviderWithMostSubscriberMetric(): Promise<Top10ProviderWithMostSubscriberMetric> {
    const macroCategories = await Promise.all(
      MACRO_CATEGORIES.map((macroCategory) =>
        this.getMacroCategoryAttributeIds(macroCategory).then((attributeIds) => ({
          id: macroCategory.id,
          name: macroCategory.name,
          attributeIds,
        }))
      )
    )

    const allMacroCategoriesAttributeIds = macroCategories.map((macro) => macro.attributeIds).flat()

    const result = await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection(env.AGREEMENTS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            'data.state': {
              $in: ['Active', 'Suspended'] satisfies Array<Agreement['state']>,
            },
            'data.certifiedAttributes': {
              $elemMatch: { id: { $in: allMacroCategoriesAttributeIds } },
            },
          },
        },
        {
          $group: {
            _id: '$data.producerId',
            agreements: {
              $push: '$data.certifiedAttributes.id',
            },
            agreementsCount: { $sum: 1 },
          },
        },
        { $sort: { agreementsCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: env.TENANTS_COLLECTION_NAME,
            localField: '_id',
            foreignField: 'data.id',
            as: 'producer',
          },
        },
        {
          $project: {
            _id: 0,
            name: { $arrayElemAt: ['$producer.data.name', 0] },
            agreements: 1,
          },
        },
        {
          $project: {
            name: 1,
            topSubscribers: macroCategories.map((macroCategory) => ({
              id: macroCategory.id,
              name: macroCategory.name,
              agreementsCount: {
                $map: {
                  input: '$agreements',
                  as: 'agreement',
                  in: {
                    $filter: {
                      input: '$$agreement',
                      as: 'attributeId',
                      cond: {
                        $in: ['$$attributeId', macroCategory.attributeIds],
                      },
                    },
                  },
                },
              },
            })),
          },
        },
        {
          $project: {
            name: 1,
            topSubscribers: {
              $map: {
                input: '$topSubscribers',
                as: 'topSubscriber',
                in: {
                  id: '$$topSubscriber.id',
                  name: '$$topSubscriber.name',
                  agreementsCount: {
                    $size: {
                      $filter: {
                        input: '$$topSubscriber.agreementsCount',
                        as: 'agreement',
                        cond: {
                          $gt: [{ $size: '$$agreement' }, 0],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      ])
      .toArray()

    return Top10ProviderWithMostSubscriberMetric.parse(result)
  }

  private async getMacroCategoryTop10MostSubscribedEServices(
    macroCategory: (typeof MACRO_CATEGORIES)[number]
  ): Promise<Top10MostSubscribedEServicesPerMacroCategoryMetric[number]> {
    const attributeIds = await this.getMacroCategoryAttributeIds(macroCategory)

    const result = await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: Agreement }>(env.AGREEMENTS_COLLECTION_NAME)
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
            from: env.ESERVICES_COLLECTION_NAME,
            localField: '_id.eserviceId',
            foreignField: 'data.id',
            as: 'eservice',
          },
        },
        {
          $lookup: {
            from: env.TENANTS_COLLECTION_NAME,
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

  private async getMacroCategoryPublishedEServiceCount(
    macroCategory: (typeof MACRO_CATEGORIES)[number]
  ): Promise<MacroCategoriesPublishedEServicesMetric[number]> {
    const result = await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: EService }>(env.ESERVICES_COLLECTION_NAME)
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
            from: env.TENANTS_COLLECTION_NAME,
            localField: 'producerId',
            foreignField: 'data.id',
            as: 'producer',
          },
        },
        {
          $lookup: {
            from: env.ATTRIBUTES_COLLECTION_NAME,
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
      publishedEServicesCount: result[0]?.result ?? 0,
    }
  }

  private _attributeIdsCache: Record<string, Array<string>> = {}

  private async getMacroCategoryAttributeIds(
    macroCategory: (typeof MACRO_CATEGORIES)[number]
  ): Promise<Array<string>> {
    return (
      this._attributeIdsCache[macroCategory.name] ??
      this.client
        .db(env.READ_MODEL_DB_NAME)
        .collection<{ data: Attribute }>(env.ATTRIBUTES_COLLECTION_NAME)
        .find({
          'data.code': {
            $in: macroCategory.ipaCodes,
          },
        })
        .project({
          _id: 0,
          'data.id': 1,
        })
        .toArray()
        .then((attributes) => attributes.map((attribute) => attribute.data.id))
    )
  }
}
