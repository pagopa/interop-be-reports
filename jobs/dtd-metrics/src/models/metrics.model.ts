import { z } from 'zod'

export const PublishedEServicesMetric = z.object({
  count: z.number(),
  lastMonthCount: z.number(),
  variation: z.number(),
})

export const EServicesByMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
  })
)

function timedMetricObject<T extends z.ZodSchema>(
  schema: T
): z.ZodObject<{ lastSixMonths: T; lastTwelveMonths: T; fromTheBeginning: T }> {
  return z.object({
    lastSixMonths: schema,
    lastTwelveMonths: schema,
    fromTheBeginning: schema,
  })
}

export const MostSubscribedEServices = timedMetricObject(
  z.array(
    z.object({
      eserviceName: z.string(),
      producerName: z.string(),
      subscribersCount: z.number(),
    })
  )
)

export const MostSubscribedEServicesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    mostSubscribedEServices: MostSubscribedEServices,
  })
)

export const TopProducersBySubscribersMetric = timedMetricObject(
  z.array(
    z.object({
      producerName: z.string(),
      macroCategories: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          subscribersCount: z.number(),
        })
      ),
    })
  )
)

export const TenantOnboardingTrendMetric = timedMetricObject(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(z.object({ date: z.date(), count: z.number() })),
      totalCount: z.number(),
      onboardedCount: z.number(),
      startingDate: z.date(),
    })
  )
)

export const OnboardedTenantsCountMetric = z.object({
  totalTenantsCount: z.number(),
  lastMonthTenantsCount: z.number(),
  variation: z.number(),
})

export const TenantDistributionMetric = z.array(
  z.object({
    activity: z.enum(['Solo fruitore', 'Solo erogatore', 'Sia fruitore che erogatore', 'Solo accesso']),
    count: z.number(),
  })
)

export const OnboardedTenantsCountByMacroCategoriesMetric = timedMetricObject(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      onboardedCount: z.number(),
      totalCount: z.number(),
    })
  )
)

export const TopProducersMetricItem = z.object({
  producerName: z.string(),
  count: z.number(),
})

export type TopProducersMetricItem = z.infer<typeof TopProducersMetricItem>

export const TopProducersMetric = timedMetricObject(z.array(TopProducersMetricItem))

export type TopProducersMetric = z.infer<typeof TopProducersMetric>

export const MetricsOutput = z.object({
  publishedEServices: PublishedEServicesMetric,
  eservicesByMacroCategories: EServicesByMacroCategoriesMetric,
  mostSubscribedEServices: MostSubscribedEServicesMetric,
  topProducersBySubscribers: TopProducersBySubscribersMetric,
  topProducers: TopProducersMetric,
  // .optional() will be removed once the metric will be implemented
  onboardedTenantsCount: OnboardedTenantsCountMetric.optional(),
  tenantDistribution: TenantDistributionMetric.optional(),
  tenantOnboardingTrend: TenantOnboardingTrendMetric.optional(),
  onboardedTenantsCountByMacroCategories: OnboardedTenantsCountByMacroCategoriesMetric.optional(),
})

export type MetricsOutput = z.infer<typeof MetricsOutput>

export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>
export type EServicesByMacroCategoriesMetric = z.infer<typeof EServicesByMacroCategoriesMetric>
export type MostSubscribedEServices = z.infer<typeof MostSubscribedEServices>
export type MostSubscribedEServicesMetric = z.infer<typeof MostSubscribedEServicesMetric>
export type TopProducersBySubscribersMetric = z.infer<typeof TopProducersBySubscribersMetric>
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>
export type TenantOnboardingTrendMetric = z.infer<typeof TenantOnboardingTrendMetric>
export type OnboardedTenantsCountByMacroCategoriesMetric = z.infer<typeof OnboardedTenantsCountByMacroCategoriesMetric>
