import {
  ATTRIBUTES_COLLECTION_NAME,
  Agreement,
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
  Tenant,
} from '@interop-be-reports/commons'
import { getMacroCategoriesWithAttributes, getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import orderBy from 'lodash/orderBy.js'
import uniq from 'lodash/uniq.js'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { MostSubscribedEServicesMetric } from '../models/metrics.model.js'

type ConsumerEntry = { macrocategoryId: string; name: string }
type RelevantAgreementInfo = { macrocategoryId: string; consumerName: string; consumerId: string; createdAt: Date }
type EServiceMap = Record<
  string,
  {
    producerId: string
    eserviceName: string
    producerName: string
    agreements: Array<RelevantAgreementInfo>
  }
>
type EServiceCollectionItem = {
  eserviceId: string
  producerId: string
  eserviceName: string
  producerName: string
  agreements: Array<RelevantAgreementInfo>
}

export async function getMostSubscribedEServicesMetric(
  readModel: ReadModelClient
): Promise<MostSubscribedEServicesMetric> {
  /*
   * We retrieve all the agreement data we need (eserviceId, consumerId, producerId, eserviceName).
   * The state of the agreement must be Active or Suspended.
   */
  const agreements = await readModel.agreements
    .aggregate([
      {
        $match: {
          'data.state': {
            $in: ['Active', 'Suspended'] satisfies Array<AgreementState>,
          },
        },
      },
      {
        $lookup: {
          from: ESERVICES_COLLECTION_NAME,
          localField: 'data.eserviceId',
          foreignField: 'data.id',
          as: 'eservice',
        },
      },
      {
        $lookup: {
          from: TENANTS_COLLECTION_NAME,
          localField: 'data.producerId',
          foreignField: 'data.id',
          as: 'producer',
        },
      },
      {
        $project: {
          _id: 0,
          eserviceId: '$data.eserviceId',
          consumerId: '$data.consumerId',
          producerId: '$data.producerId',
          eserviceName: { $arrayElemAt: ['$eservice.data.name', 0] },
          producerName: { $arrayElemAt: ['$producer.data.name', 0] },
          createdAt: '$data.createdAt',
        },
      },
    ])
    .map((a) =>
      Agreement.pick({ eserviceId: true, consumerId: true, producerId: true, createdAt: true })
        .merge(z.object({ eserviceName: z.string(), producerName: z.string() }))
        .parse(a)
    )
    .toArray()

  /**
   * We retrieve the consumers data from and put it in a map.
   * { [consumerId]: { macrocategoryId, name } }
   */
  const consumersIds = uniq(agreements.map((a) => a.consumerId))
  const consumersMap = await getConsumersMap(readModel, consumersIds)

  /**
   * With the consumers map, we enrich the agreements with the consumer macrocategory id and the consumer name.
   * We have now a collection of agreements with the following shape:
   * { eserviceId, consumerId, producerId, eserviceName, macrocategoryId, consumerName }
   */
  const enrichedAgreements = agreements.map((a) => ({
    ...a,
    macrocategoryId: consumersMap[a.consumerId].macrocategoryId,
    consumerName: consumersMap[a.consumerId].name,
  }))

  /*
   * From the enriched agreements, we create a map of eservices.
   * The key is the eservice id, the value is an object with the producer id, the eservice name, the producer name and an array of agreements.
   * The agreements array contains the macrocategory id and the consumer name of each agreement.
   * { [eserviceId]: { producerId, eserviceName, producerName, agreements: [ { macrocategoryId, consumerName } ] } }
   */
  const eservicesMap = enrichedAgreements.reduce<EServiceMap>((acc, next) => {
    // If it's the first time we meet this eservice id, initialize a new array
    if (!acc[next.eserviceId]) {
      acc[next.eserviceId] = {
        producerId: next.producerId,
        eserviceName: next.eserviceName,
        producerName: next.producerName,
        agreements: [],
      }
    }
    // Add to the array the macrocategory this tenant belongs to
    acc[next.eserviceId].agreements.push({
      macrocategoryId: next.macrocategoryId,
      consumerName: next.consumerName,
      consumerId: next.consumerId,
      createdAt: next.createdAt,
    })
    // Return the updated map
    return acc
  }, {})

  /**
   * We convert the eservicesMap to an array.
   * [ { eserviceId, producerId, eserviceName, producerName, agreements: [ { macrocategoryId, consumerName } ] }
   */
  const eserviceCollection: Array<EServiceCollectionItem> = Object.entries(eservicesMap).map(
    ([eserviceId, eservice]) => {
      return {
        eserviceId,
        producerId: eservice.producerId,
        eserviceName: eservice.eserviceName,
        producerName: eservice.producerName,
        agreements: eservice.agreements,
      }
    }
  )

  /**
   * We have all the data we need to create the metric.
   */

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)
  const fromTheBeginningDate = undefined

  const result = [{ id: '0', name: 'Tutte' }, ...MACRO_CATEGORIES].map((m) => {
    const getSubscribersCount = (eservice: EServiceCollectionItem, date: Date | undefined): number => {
      const agreements = date ? eservice.agreements.filter((a) => a.createdAt >= date) : eservice.agreements

      // Some subscribers can have more than one agreement, we want to count them only once
      const activeSubscribers = agreements.reduce<Array<RelevantAgreementInfo>>((acc, next) => {
        if (!acc.some((a) => a.consumerId === next.consumerId)) {
          acc.push(next)
        }
        return acc
      }, [])

      // If the macrocategory id is 0, we count all the active subscribers
      if (m.id === '0') {
        return activeSubscribers.length
      }

      // Otherwise, we count the active subscribers that belong to the macrocategory
      return activeSubscribers.filter((a) => a.macrocategoryId === m.id).length
    }

    const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = [
      sixMonthsAgoDate,
      twelveMonthsAgoDate,
      fromTheBeginningDate,
    ].map((date) => {
      const counted = eserviceCollection.map((e) => ({
        eserviceName: e.eserviceName,
        producerName: e.producerName,
        subscribersCount: getSubscribersCount(e, date),
      }))

      // Sort the entries by count, and extract the first 10 results (top 10)
      return orderBy(counted, 'subscribersCount', 'desc').slice(0, 10)
    })

    return {
      id: m.id,
      name: m.name,
      mostSubscribedEServices: { lastSixMonths, lastTwelveMonths, fromTheBeginning },
    }
  })

  return MostSubscribedEServicesMetric.parse(result)
}

async function getConsumersMap(
  readModel: ReadModelClient,
  consumerIds: Array<string>
): Promise<Record<string, ConsumerEntry>> {
  const consumersQuery = readModel.tenants
    .aggregate([
      {
        $match: {
          'data.id': {
            $in: consumerIds,
          },
        },
      },
      {
        $lookup: {
          from: ATTRIBUTES_COLLECTION_NAME,
          localField: 'data.attributes.id',
          foreignField: 'data.id',
          as: 'attributes',
        },
      },
      {
        $addFields: {
          attributes: {
            $filter: {
              input: '$attributes',
              as: 'attribute',
              cond: {
                $eq: ['$$attribute.data.kind', 'Certified'],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          id: '$data.id',
          name: '$data.name',
          attributesIds: '$attributes.data.id',
        },
      },
    ])
    .map((t) =>
      Tenant.pick({ id: true, name: true })
        .merge(z.object({ attributesIds: z.array(z.string()) }))
        .parse(t)
    )
    .toArray()

  const [macroCategoriesWithAttributes, consumers] = await Promise.all([
    getMacroCategoriesWithAttributes(readModel),
    consumersQuery,
  ])

  // Create a map. The key is the consumerId, the value the IPA macrocategory id, if any
  const consumersMap = consumers.reduce<Record<string, ConsumerEntry>>((acc, next) => {
    const macrocategoryId =
      macroCategoriesWithAttributes.find((m) => m.attributes.some((a) => next.attributesIds.includes(a.id)))?.id ?? '-1'

    return { ...acc, [next.id]: { macrocategoryId, name: next.name } }
  }, {})

  return consumersMap
}
