import { getAttributeMock } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../../configs/macro-categories.js'
import { readModelMock, seedCollection } from '../tests.utils.js'
import { getMacroCategoriesWithAttributes } from '../helpers.utils.js'
import { randomUUID } from 'crypto'

const macroCategory = MACRO_CATEGORIES[1]

const attributeId1 = randomUUID()
const attributeId2 = randomUUID()
const attributeId3 = randomUUID()

describe('getMacroCategoriesWithAttributes', () => {
  it('should return the corrent attributesIds', async () => {
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: attributeId1 }) },
    ])
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: attributeId2 }) },
    ])
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: attributeId3 }) },
    ])

    const result = await getMacroCategoriesWithAttributes(readModelMock)

    expect(result[1].attributes).toEqual([
      { code: macroCategory.ipaCodes[0], id: attributeId1 },
      { code: macroCategory.ipaCodes[1], id: attributeId2 },
      { code: macroCategory.ipaCodes[2], id: attributeId3 },
    ])
  })

  it('should return the cached result if the macro category has already been queried', async () => {
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: attributeId1 }) },
    ])
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: attributeId2 }) },
    ])
    await seedCollection('attributes', [
      { data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: attributeId3 }) },
    ])

    const result1 = await getMacroCategoriesWithAttributes(readModelMock)
    const result2 = await getMacroCategoriesWithAttributes(readModelMock)

    const areSameReferences = result1 === result2
    expect(areSameReferences).toBe(true)
  })
})
