import { getAttributeMock } from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../../configs/macro-categories.js'
import { readModelMock, seedCollection } from '../tests.utils.js'
import { getMacroCategoriesWithAttributes } from '../helpers.utils.js'

const macroCategory = MACRO_CATEGORIES[1]

describe('getMacroCategoriesWithAttributes', () => {
  it('should return the corrent attributesIds', async () => {
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: 'id-1' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: 'id-2' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: 'id-3' }) }])

    const result = await getMacroCategoriesWithAttributes(readModelMock)

    expect(result).toEqual(['id-1', 'id-2', 'id-3'])
  })

  it('should return the cached result if the macro category has already been queried', async () => {
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: 'id-1' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: 'id-2' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: 'id-3' }) }])

    const result1 = await getMacroCategoriesWithAttributes(readModelMock)
    const result2 = await getMacroCategoriesWithAttributes(readModelMock)

    const areSameReferences = result1 === result2
    expect(areSameReferences).toBe(true)
  })
})
