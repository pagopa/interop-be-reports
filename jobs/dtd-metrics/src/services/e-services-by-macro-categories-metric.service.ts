import { EServiceDescriptor, ReadModelClient } from '@interop-be-reports/commons'
import { EServicesByMacroCategoriesMetric } from '../models/metrics.model.js'
import { GlobalStoreService } from './global-store.service.js'
import { MacroCategory } from '../models/macro-categories.model.js'
import { z } from 'zod'

/**
 * @see https://pagopa.atlassian.net/browse/PIN-3745
 */
export async function getEServicesByMacroCategoriesMetric(
  readModel: ReadModelClient,
  globalStore: GlobalStoreService
): Promise<EServicesByMacroCategoriesMetric> {
  const eservices = await readModel.eservices
    .aggregate([
      {
        $match: {
          'data.descriptors.state': {
            $in: ['Published', 'Suspended'] satisfies Array<EServiceDescriptor['state']>,
          },
        },
      },
      {
        $project: {
          _id: 0,
          'data.producerId': 1,
        },
      },
    ])
    .map(({ data }) => z.object({ producerId: z.string() }).parse(data))
    .toArray()

  const getMacroCategoryPublishedEServicesCount = (macroCategory: MacroCategory): number =>
    eservices.reduce((count, eservice) => {
      if (macroCategory.tenantsIds.has(eservice.producerId)) return count + 1
      else return count
    }, 0)

  const result = globalStore.macroCategories.map((macroCategory) => ({
    id: macroCategory.id,
    name: macroCategory.name,
    count: getMacroCategoryPublishedEServicesCount(macroCategory),
  }))

  return EServicesByMacroCategoriesMetric.parse(result)
}
