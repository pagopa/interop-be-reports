import { getAttributeMock } from '@interop-be-reports/commons'
import { readModel, seedCollection } from './metrics-tests.utils.js'
import { MACRO_CATEGORIES } from '../../configs/macro-categories.js'
import { getMacroCategoryAttributesIds } from '../macro-categories-attributes-ids.service.js'

const macroCategory = MACRO_CATEGORIES[1]

describe('getMacroCategoriesAttributesIds', () => {
  it('should return the corrent attributesIds', async () => {
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: 'id-1' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: 'id-2' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: 'id-3' }) }])

    const result = await getMacroCategoryAttributesIds(macroCategory, readModel)

    expect(result).toEqual(['id-1', 'id-2', 'id-3'])
  })

  it('should return the cached result if the macro category has already been queried', async () => {
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[0], id: 'id-1' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[1], id: 'id-2' }) }])
    await seedCollection('attributes', [{ data: getAttributeMock({ code: macroCategory.ipaCodes[2], id: 'id-3' }) }])

    const result1 = await getMacroCategoryAttributesIds(macroCategory, readModel)
    const result2 = await getMacroCategoryAttributesIds(macroCategory, readModel)

    const areSameReferences = result1 === result2
    expect(areSameReferences).toBe(true)
  })
})
