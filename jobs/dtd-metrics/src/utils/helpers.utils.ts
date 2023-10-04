import { ReadModelClient } from '@interop-be-reports/commons'
import { sub } from 'date-fns'

export function getSixMonthsAgoDate(): Date {
  return sub(new Date(), { months: 6 })
}

export function getOneYearAgoDate(): Date {
  return sub(new Date(), { years: 1 })
}

const cache = new Map<string, Array<string>>()

/**
 * This function returns all attributes ids related to the given ipa codes
 * @param ipaCodes The ipa codes to get attributes ids from.
 * @param readModel The read model client.
 * @returns The attributes ids.
 */
export async function getAttributesIdsFromIpaCodes(
  ipaCodes: ReadonlyArray<string> | Array<string>,
  readModel: ReadModelClient
): Promise<Array<string>> {
  const cacheKey = ipaCodes.join('-')
  const cachedResult = cache.get(cacheKey)

  if (cachedResult) return cachedResult

  const attributesIds: Array<string> = await readModel.attributes
    .find({
      'data.code': {
        $in: ipaCodes,
      },
    })
    .project({
      _id: 0,
      'data.id': 1,
    })
    .map((attribute) => attribute.data.id)
    .toArray()

  cache.set(cacheKey, attributesIds)
  return attributesIds
}
