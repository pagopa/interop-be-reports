import { MongoClient } from 'mongodb'
import { env } from '../configs/env.js'
import { Agreement, EService, EServiceDescriptor } from '@interop-be-reports/commons'
import { MacroCategory, orgsMacroCategories } from '../configs/constants.js'

export class ReadModelQueriesClient {
  constructor(private client: MongoClient) {}

  /**
   * Queries the number of published e-services.
   * Published e-services are those that have at least one descriptor with state Published or Suspended.
   **/
  async getPublishedEServicesMetric() {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: EService }>(env.ESERVICES_COLLECTION_NAME)
      .countDocuments({
        'data.descriptors.state': {
          $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
        },
      })
  }

  /**
   * Queries the number of published e-services per macro-category.
   * Macro-categories are defined in the constants file.
   */
  async getMacroCategoriesPublishedEServicesMetric() {
    return Promise.all(
      orgsMacroCategories.map((macroCategory) =>
        this.getMacroCategoryPublishedEServiceCount(macroCategory)
      )
    )
  }

  async getTop10MostSubscribedEServicesMetric() {
    return await this.client
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
            activeAgreements: {
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
        { $sort: { activeAgreements: -1 } },
        { $limit: 10 },
      ])
      .toArray()
  }

  async getTop10MostSubscribedEServicesPerMacroCategoryMetric() {
    return Promise.all(
      orgsMacroCategories.map((macroCategory) =>
        this.getMacroCategoryTop10MostSubscribedEServices(macroCategory)
      )
    )
  }

  async getTop10ProviderWithMostSubscriberMetric() {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection(env.AGREEMENTS_COLLECTION_NAME)
      .aggregate([
        {
          $match: {
            'data.state': {
              $in: ['Active', 'Suspended'] satisfies Array<Agreement['state']>,
            },
          },
        },
        {
          $group: {
            _id: '$data.producerId',
            agreements: {
              $push: '$data',
            },
            count: {
              $sum: 1,
            },
          },
        },
        { $sort: { count: -1 } },
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
          $lookup: {
            from: env.TENANTS_COLLECTION_NAME,
            localField: 'agreements.consumerId',
            foreignField: 'data.id',
            as: 'consumers',
          },
        },
        {
          $lookup: {
            from: env.ATTRIBUTES_COLLECTION_NAME,
            localField: 'consumers.data.attributes.id',
            foreignField: 'data.id',
            as: 'attributes',
          },
        },
        {
          $project: {
            _id: 0,
            name: { $arrayElemAt: ['$producer.data.name', 0] },
            ipaCodes: {
              $map: {
                input: '$consumers',
                as: 'consumer',
                in: {
                  $map: {
                    input: '$$consumer.data.attributes',
                    as: 'attr',
                    in: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$attributes',
                            as: 'attribute',
                            cond: {
                              $and: [
                                { $eq: ['$$attribute.data.id', '$$attr.id'] },
                                { $eq: ['$$attribute.data.kind', 'Certified'] },
                              ],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            ipaCodes: {
              $map: {
                input: '$ipaCodes',
                as: 'i',
                in: '$$i.data.code',
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            top: orgsMacroCategories.map((macroCategory) => ({
              id: macroCategory.id,
              name: macroCategory.name,
              count: {
                $map: {
                  input: '$ipaCodes',
                  as: 'i',
                  in: {
                    $filter: {
                      input: '$$i',
                      as: 'attr',
                      cond: {
                        $in: ['$$attr', macroCategory.codes],
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
            top: {
              $map: {
                input: '$top',
                as: 't',
                in: {
                  id: '$$t.id',
                  name: '$$t.name',
                  count: {
                    $size: {
                      $filter: {
                        input: '$$t.count',
                        as: 'i',
                        cond: {
                          $ne: ['$$i', []],
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
  }

  private async getMacroCategoryTop10MostSubscribedEServices(macroCategory: MacroCategory) {
    return await this.client
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
            agreements: {
              $filter: {
                input: '$agreements',
                as: 'agreement',
                cond: {
                  $or: [
                    { $eq: ['$$agreement.data.state', 'Active'] },
                    { $eq: ['$$agreement.data.state', 'Suspended'] },
                  ],
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            producerName: 1,
            consumersIds: {
              $map: {
                input: '$agreements',
                as: 'agreement',
                in: '$$agreement.data.consumerId',
              },
            },
          },
        },
        {
          $lookup: {
            from: env.TENANTS_COLLECTION_NAME,
            localField: 'consumersIds',
            foreignField: 'data.id',
            as: 'consumers',
          },
        },
        {
          $project: {
            name: 1,
            producerName: 1,
            consumers: {
              $map: {
                input: '$consumers',
                as: 'consumer',
                in: {
                  id: '$$consumer.data.id',
                  name: '$$consumer.data.name',
                  certifiedAttributes: {
                    $filter: {
                      input: '$$consumer.data.attributes',
                      as: 'attr',
                      cond: {
                        $eq: ['$$attr.type', 'PersistentCertifiedAttribute'],
                      },
                    },
                  },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: env.ATTRIBUTES_COLLECTION_NAME,
            localField: 'consumers.certifiedAttributes.id',
            foreignField: 'data.id',
            as: 'consumerAttributes',
          },
        },
        {
          $project: {
            name: 1,
            producerName: 1,
            ipaCodes: {
              $map: {
                input: '$consumers',
                as: 'consumer',
                in: {
                  $map: {
                    input: '$$consumer.certifiedAttributes',
                    as: 'attr',
                    in: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$consumerAttributes',
                            as: 'consumerAttr',
                            cond: {
                              $eq: ['$$consumerAttr.data.id', '$$attr.id'],
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            producerName: 1,
            ipaCodes: {
              $map: {
                input: '$ipaCodes',
                as: 'i',
                in: {
                  $filter: {
                    input: '$$i',
                    as: 'attr',
                    cond: {
                      $in: ['$$attr.data.code', macroCategory.codes],
                    },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            producerName: 1,
            agreementCount: {
              $size: {
                $filter: {
                  input: '$ipaCodes',
                  as: 'i',
                  cond: {
                    $ne: ['$$i', []],
                  },
                },
              },
            },
          },
        },
        {
          $sort: {
            agreementCount: -1,
          },
        },
        {
          $limit: 10,
        },
      ])
      .toArray()
      .then((res) => ({
        id: macroCategory.id,
        name: macroCategory.name,
        top10MostSubscribedEServices: res,
      }))
  }

  /**
   * Queries the number of published e-services per macro-category.
   * Macro-categories are defined in the constants file.
   */
  private async getMacroCategoryPublishedEServiceCount(macroCategory: MacroCategory) {
    return await this.client
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
                    $or: macroCategory.codes.map((code) => ({
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
      .then((res) => ({
        id: macroCategory.id,
        name: macroCategory.name,
        publishedEServicesCount: res[0]?.result ?? 0,
      }))
  }
}
