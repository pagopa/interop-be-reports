import {
  ATTRIBUTES_COLLECTION_NAME,
  Agreement,
  AgreementState,
  ESERVICES_COLLECTION_NAME,
  ReadModelClient,
  TENANTS_COLLECTION_NAME,
  Tenant,
} from '@interop-be-reports/commons'
import { getMacroCategoriesWithAttributes } from '../utils/helpers.utils.js'
import { writeFileSync } from 'fs'
import { z } from 'zod'
import orderBy from 'lodash/orderBy.js'
import uniq from 'lodash/uniq.js'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

type TenantEntry = { macrocategoryId: number; name: string }
type RelevantAgreementInfo = { macrocategoryId: number; consumerName: string; createdAt: Date }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getTop10MostSubscribedEServicesMetricTest(readModel: ReadModelClient): Promise<any> {
  // Get all the current agreements ["Active", "Suspended"]
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
   * 1. Prendo agreements { eserviceId, consumerId, producerId, eserviceName }
   * 2. Prendo i consumers e li metto in una mappa { consumerId: { macrocategoryId, name } }
   * 3. Tramite le mappa dei consumer, aggiungo il macrocategoryId agli agreements { eserviceId, consumerId, producerId, eserviceName, macrocategoryId }
   * 4. Dagli agreement creo un'altra mappa { eserviceId: { producerId, eserviceName, macrocategoryIds } } con macrocategoryIds uguale al numero di agreement per quella macrocategory
   */

  const tenantIds = uniq(agreements.map((a) => a.consumerId))

  // Turn them into a map by id, adding the macrocategory the Tenant belongs to, if any
  const tenantsMap = await getTenantsMap(readModel, tenantIds)

  // Add the macrocategoryId to the agreements
  const enrichedAgreements = agreements.map((a) => ({
    ...a,
    macrocategoryId: tenantsMap[a.consumerId].macrocategoryId,
    consumerName: tenantsMap[a.consumerId].name,
  }))

  // Create a map with the eserviceId as a key
  const eservicesMap = enrichedAgreements.reduce<EServiceMap>((acc, next) => {
    // If it's the first time we meet this eservice id, initialize a new array
    if (!acc[next.eserviceId])
      acc[next.eserviceId] = {
        producerId: next.producerId,
        eserviceName: next.eserviceName,
        producerName: next.producerName,
        agreements: [],
      }
    // Add to the array the macrocategory this tenant belongs to
    acc[next.eserviceId].agreements.push({
      macrocategoryId: next.macrocategoryId,
      consumerName: next.consumerName,
      createdAt: next.createdAt,
    })
    // Return the updated map
    return acc
  }, {})

  // Convert the map to collection for easier parsing
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

  const result = [{ id: 0, name: 'Totale' }, ...MACRO_CATEGORIES].map((m) => {
    const countFn = m.id === 0 ? (i: EServiceCollectionItem): number => i.agreements.length : countByIdFn(m.id)

    return {
      id: m.id,
      name: m.name,
      top10MostSubscribedEServices: getSortedTop10(eserviceCollection, countFn),
    }
  })

  console.timeEnd()

  writeFileSync('./output.json', JSON.stringify(result, null, 2))
  return result
}

// Query some tenants and output a map
async function getTenantsMap(
  readModel: ReadModelClient,
  consumerIds: Array<string>
): Promise<Record<string, TenantEntry>> {
  // Query all the consumers
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

  // Run the queries in parallel
  const [macroCategoriesWithAttributes, tenants] = await Promise.all([
    getMacroCategoriesWithAttributes(readModel),
    consumersQuery,
  ])

  // Create a map. The key is the tenantId, the value the IPA macrocategory id, if any
  const tenantsMap = tenants.reduce<Record<string, TenantEntry>>((acc, next) => {
    // Let's assume the tenant has no macrocategory
    let macrocategoryId = -1

    // If there is a match (a macrocategory)
    const macroCategory = macroCategoriesWithAttributes.find((m) =>
      m.attributes.some((a) => next.attributesIds.includes(a.id))
    )
    if (macroCategory) {
      // Set that id as the macrocategory id
      macrocategoryId = macroCategory.id
    }

    return { ...acc, [next.id]: { macrocategoryId, name: next.name } }
  }, {})

  return tenantsMap
}

function getSortedTop10(
  collection: Array<EServiceCollectionItem>,
  countFn: (i: EServiceCollectionItem) => number
): Array<unknown> {
  // Count the occurrences of a particular case, and add it to the entry
  const counted = collection.map((i) => ({
    eserviceName: i.eserviceName,
    tenantName: i.producerName,
    count: countFn(i),
  }))
  // Sort the entries by count, and extract the first 10 results (top 10)
  return orderBy(counted, 'count', 'desc').slice(0, 10)
}

function countByIdFn(id: number): (i: EServiceCollectionItem) => number {
  return (i: EServiceCollectionItem) => i.agreements.filter((n) => n.macrocategoryId === id).length
}
