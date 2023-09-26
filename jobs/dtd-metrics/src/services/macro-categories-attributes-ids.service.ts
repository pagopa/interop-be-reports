import { ReadModelClient } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

const cache = new Map<string, Array<string>>()

export async function getMacroCategoryAttributesIds(
  macroCategory: (typeof MACRO_CATEGORIES)[number],
  readModel: ReadModelClient
): Promise<Array<string>> {
  const cachedResult = cache.get(macroCategory.id)

  if (cachedResult) return cachedResult

  const attributesIds: Array<string> = await readModel.attributes
    .find({
      'data.code': {
        $in: macroCategory.ipaCodes,
      },
    })
    .project({
      _id: 0,
      'data.id': 1,
    })
    .map((attribute) => attribute.data.id)
    .toArray()

  cache.set(macroCategory.id, attributesIds)
  return attributesIds
}
