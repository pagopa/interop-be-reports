import { Attribute, ReadModelClient } from '@interop-be-reports/commons'
import { sub } from 'date-fns'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'
import { z } from 'zod'

export function getSixMonthsAgoDate(): Date {
  return sub(new Date(), { months: 6 })
}

export function getOneYearAgoDate(): Date {
  return sub(new Date(), { years: 1 })
}

const MacroCategoriesWithAttributes = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    ipaCodes: z.array(z.string()),
    attributes: z.array(
      z.object({
        id: z.string(),
        code: z.string(),
      })
    ),
  })
)
type MacroCategoriesWithAttributes = z.infer<typeof MacroCategoriesWithAttributes>

let cache: MacroCategoriesWithAttributes

/**
 * This function returns all macro categories with their attributes.
 * @param readModel The read model client.
 * @returns The attributes ids.
 */
export async function getMacroCategoriesWithAttributes(
  readModel: ReadModelClient
): Promise<MacroCategoriesWithAttributes> {
  if (cache) return cache

  const ipaCodes = MACRO_CATEGORIES.flatMap((macroCategory) => macroCategory.ipaCodes)

  const attributes = await readModel.attributes
    .find({
      'data.code': {
        $in: ipaCodes,
      },
    })
    .project({
      _id: 0,
      'data.id': 1,
      'data.code': 1,
    })
    .map((attribute) => Attribute.pick({ id: true, code: true }).parse(attribute.data))
    .toArray()

  const macroCategoriesWithAttributes = MACRO_CATEGORIES.map((macroCategory) => ({
    ...macroCategory,
    attributes: attributes.filter(({ code }) =>
      (macroCategory.ipaCodes as ReadonlyArray<string | undefined>).includes(code)
    ),
  }))

  const result = MacroCategoriesWithAttributes.parse(macroCategoriesWithAttributes)
  cache = result
  return result
}
