import { ReadModelClient } from '@interop-be-reports/commons'
import { Document } from 'mongodb'
import {
  MacroCategoriesWithAttributes,
  getMacroCategoriesWithAttributes,
  getMonthsAgoDate,
} from '../utils/helpers.utils.js'
import { OnboardedTenantsCountByMacroCategoriesMetric } from '../models/metrics.model.js'

export async function getOnboardedTenantsCountByMacroCategoriesMetric(
  readModel: ReadModelClient
): Promise<OnboardedTenantsCountByMacroCategoriesMetric> {
  const macroCategories = await getMacroCategoriesWithAttributes(readModel)

  const dates = [getMonthsAgoDate(6), getMonthsAgoDate(12), undefined]

  const [lastSixMonths, lastTwelveMonths, fromTheBeginning] = await Promise.all(
    dates.map((date) => getMacroCategoriesOnboardedAndTotalTenantsCountArray(readModel, macroCategories, date))
  )

  return OnboardedTenantsCountByMacroCategoriesMetric.parse({ lastSixMonths, lastTwelveMonths, fromTheBeginning })
}

async function getMacroCategoriesOnboardedAndTotalTenantsCountArray(
  readModel: ReadModelClient,
  macroCategories: MacroCategoriesWithAttributes,
  date: Date | undefined
): Promise<OnboardedTenantsCountByMacroCategoriesMetric['fromTheBeginning' | 'lastSixMonths' | 'lastTwelveMonths']> {
  return await Promise.all(
    macroCategories.map((m) => getMacroCategoryOnboardedAndTotalTenantsCount(readModel, m, date))
  )
}

async function getMacroCategoryOnboardedAndTotalTenantsCount(
  readModel: ReadModelClient,
  macroCategory: MacroCategoriesWithAttributes[number],
  date: Date | undefined
): Promise<
  OnboardedTenantsCountByMacroCategoriesMetric['fromTheBeginning' | 'lastSixMonths' | 'lastTwelveMonths'][number]
> {
  const attributesIds = macroCategory.attributes.map((a) => a.id)

  const onboardedTenantsCountPromise = readModel.tenants.countDocuments(
    getTenantsCountDocumentsCountFilter('onboarded', attributesIds, date)
  )

  const totalTenantsCountPromise = readModel.tenants.countDocuments(
    getTenantsCountDocumentsCountFilter('total', attributesIds, date)
  )

  const [oboardedCount, totalCount] = await Promise.all([onboardedTenantsCountPromise, totalTenantsCountPromise])

  return { id: macroCategory.id, name: macroCategory.name, oboardedCount, totalCount }
}

function getTenantsCountDocumentsCountFilter(
  queryType: 'onboarded' | 'total',
  attributesIds: Array<string>,
  startingDate?: Date
): Document {
  const oboardedFilter: Document = queryType === 'onboarded' ? { 'data.selfcareId': { $exists: true } } : {}
  const createAtFilter: Document = startingDate ? { 'data.createdAt': { $gte: startingDate.toISOString() } } : {}

  return {
    ...oboardedFilter,
    ...createAtFilter,
    'data.attributes': {
      $elemMatch: { id: { $in: attributesIds } },
    },
  }
}
