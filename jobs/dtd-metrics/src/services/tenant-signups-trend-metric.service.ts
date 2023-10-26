import { ReadModelClient, Tenant } from '@interop-be-reports/commons'
import { getMacroCategoriesWithAttributes, getMonthsAgoDate } from '../utils/helpers.utils.js'
import { add } from 'date-fns'
import { TenantSignupsTrendMetric } from '../models/metrics.model.js'
import { z } from 'zod'

type MacroCategoryWithAttributes = Awaited<ReturnType<typeof getMacroCategoriesWithAttributes>>[number]
type EnrichedMacroCategory = MacroCategoryWithAttributes & { tenantsCreatedAtDates: Array<Date> }

export async function getTenantSignupsTrendMetric(readModel: ReadModelClient): Promise<TenantSignupsTrendMetric> {
  // Get all onboarded tenants
  const onboardedTenants = await readModel.tenants
    .find(
      { 'data.selfcareId': { $exists: true } },
      // TODO eventually createdAt must be replaced with onboarded at
      { projection: { _id: 0, 'data.createdAt': 1, 'data.attributes.id': 1 }, sort: { 'data.createdAt': 1 } }
    )
    .map(({ data }) =>
      Tenant.pick({ createdAt: true })
        .and(z.object({ attributes: z.array(z.object({ id: z.string() })) }))
        .parse(data)
    )
    .toArray()

  const macroCategories = await getMacroCategoriesWithAttributes(readModel)

  // Get the oldest tenant date, which will be used as the starting point for the timeseries
  const oldestTenantDate = onboardedTenants[0].createdAt // TODO to be replaced with onboardedAt

  // In each macro category put the tenants that belong to it in an array that contains the dates of their onboardings
  function enrichMacroCategoryWithTenantCreatedAtDatesArray(
    macroCategory: MacroCategoryWithAttributes
  ): EnrichedMacroCategory {
    const macroCategoryAttributeIds = macroCategory.attributes.map((attribute) => attribute.id)
    return {
      ...macroCategory,
      tenantsCreatedAtDates: onboardedTenants
        .filter((tenant) => tenant.attributes.some((attribute) => macroCategoryAttributeIds.includes(attribute.id)))
        .map((tenant) => tenant.createdAt),
    }
  }

  const macroCategoriesWithTenants = macroCategories.map(enrichMacroCategoryWithTenantCreatedAtDatesArray)

  const sixMonthsAgoDate = getMonthsAgoDate(6)
  const twelveMonthsAgoDate = getMonthsAgoDate(12)

  // Filter out tenants that are older than 6 months
  const sixMonthsAgoData = macroCategoriesWithTenants.map((macroCategory) => ({
    ...macroCategory,
    tenantsCreatedAtDates: macroCategory.tenantsCreatedAtDates.filter((date) => date > sixMonthsAgoDate),
  }))
  // Filter out tenants that are older than 12 months
  const twelveMonthsAgoData = macroCategoriesWithTenants.map((macroCategory) => ({
    ...macroCategory,
    tenantsCreatedAtDates: macroCategory.tenantsCreatedAtDates.filter((date) => date > twelveMonthsAgoDate),
  }))

  const fromTheBeginningData = macroCategoriesWithTenants

  const result = TenantSignupsTrendMetric.parse({
    lastSixMonths: sixMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(sixMonthsAgoDate, { days: 5 }, macroCategory.tenantsCreatedAtDates),
      startingDate: sixMonthsAgoDate,
    })),
    lastTwelveMonths: twelveMonthsAgoData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(twelveMonthsAgoDate, { days: 10 }, macroCategory.tenantsCreatedAtDates),
      startingDate: twelveMonthsAgoDate,
    })),
    fromTheBeginning: fromTheBeginningData.map((macroCategory) => ({
      id: macroCategory.id,
      name: macroCategory.name,
      data: toTimeseriesSequenceData(oldestTenantDate, { months: 1 }, macroCategory.tenantsCreatedAtDates),
      startingDate: oldestTenantDate,
    })),
  })

  return result
}

function toTimeseriesSequenceData(
  startingDate: Date,
  jump: Duration,
  data: Array<Date>
): Array<{ date: Date; count: number }> {
  const timeseriesData: Array<{ date: Date; count: number }> = []
  let currentDate = startingDate
  let count = 0
  while (currentDate < new Date()) {
    const newDate = add(currentDate, jump)
    count += data.filter((date) => date < newDate && date >= currentDate).length
    timeseriesData.push({ date: currentDate, count })
    currentDate = newDate
  }
  return timeseriesData
}
