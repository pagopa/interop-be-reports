import {
  Agreement,
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
} from '@interop-be-reports/commons'
import { getMonthsAgoDate } from '../utils/helpers.utils.js'
import { z } from 'zod'
import orderBy from 'lodash/orderBy.js'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { MostSubscribedEServicesMetric } from '../models/metrics.model.js'
import { GlobalStoreService } from './global-store.service.js'

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
  readModel: ReadModelClient,
  globalStore: GlobalStoreService
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

  /*
   * From the agreements, we create a map of eservices.
   * The key is the eservice id, the value is an object with the producer id, the eservice name, the producer name and an array of agreements.
   * The agreements array contains the macrocategory id and the consumer name of each agreement.
   * { [eserviceId]: { producerId, eserviceName, producerName, agreements: [ { macrocategoryId, consumerName } ] } }
   */
  const eservicesMap = agreements.reduce<EServiceMap>((acc, next) => {
    // If it's the first time we meet this eservice id, initialize a new array
    if (!acc[next.eserviceId]) {
      acc[next.eserviceId] = {
        producerId: next.producerId,
        eserviceName: next.eserviceName,
        producerName: next.producerName,
        agreements: [],
      }
    }

    const consumer = globalStore.getTenantFromId(next.consumerId)
    const macrocategoryId = globalStore.getMacroCategoryFromTenantId(next.consumerId)?.id

    // Add to the array the macrocategory this tenant belongs to
    acc[next.eserviceId].agreements.push({
      macrocategoryId: macrocategoryId ?? '-1',
      consumerName: consumer.name,
      consumerId: consumer.id,
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
