import { z } from 'zod'

function timedMetricObject<T extends z.ZodSchema>(
  schema: T
): z.ZodObject<{ lastSixMonths: T; lastTwelveMonths: T; fromTheBeginning: T }> {
  return z.object({
    lastSixMonths: schema,
    lastTwelveMonths: schema,
    fromTheBeginning: schema,
  })
}

export const PublishedEServicesMetric = z.object({
  count: z.number(),
  lastMonthCount: z.number(),
  variation: z.number(),
})
export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>

export const EServicesByMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    count: z.number(),
  })
)
export type EServicesByMacroCategoriesMetric = z.infer<typeof EServicesByMacroCategoriesMetric>

export const MostSubscribedEServices = timedMetricObject(
  z.array(
    z.object({
      eserviceName: z.string(),
      producerName: z.string(),
      subscribersCount: z.number(),
    })
  )
)
export type MostSubscribedEServices = z.infer<typeof MostSubscribedEServices>

export const MostSubscribedEServicesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    mostSubscribedEServices: MostSubscribedEServices,
  })
)
export type MostSubscribedEServicesMetric = z.infer<typeof MostSubscribedEServicesMetric>

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
export type TopProducersBySubscribersMetric = z.infer<typeof TopProducersBySubscribersMetric>

export const OnboardedTenantsCountMetric = z.object({
  totalTenantsCount: z.number(),
  lastMonthTenantsCount: z.number(),
  variation: z.number(),
})
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>

export const TenantDistributionMetric = z.array(
  z.object({
    activity: z.enum(['Solo fruitore', 'Solo erogatore', 'Sia fruitore che erogatore', 'Solo accesso']),
    count: z.number(),
  })
)
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>

export const TenantSignupsTrendMetric = timedMetricObject(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      data: z.array(z.object({ date: z.date(), count: z.number() })),
      startingDate: z.date(),
    })
  )
)
export type TenantSignupsTrendMetric = z.infer<typeof TenantSignupsTrendMetric>

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
export type OnboardedTenantsCountByMacroCategoriesMetric = z.infer<typeof OnboardedTenantsCountByMacroCategoriesMetric>

export const TopProducersMetricItem = z.object({
  producerName: z.string(),
  count: z.number(),
})

export type TopProducersMetricItem = z.infer<typeof TopProducersMetricItem>

export const TopProducersMetric = timedMetricObject(z.array(TopProducersMetricItem))

export type TopProducersMetric = z.infer<typeof TopProducersMetric>

export const Metric = z.union([
  z.object({ name: z.literal('publishedEServices'), data: PublishedEServicesMetric }),
  z.object({ name: z.literal('eservicesByMacroCategories'), data: EServicesByMacroCategoriesMetric }),
  z.object({ name: z.literal('mostSubscribedEServices'), data: MostSubscribedEServicesMetric }),
  z.object({ name: z.literal('topProducersBySubscribers'), data: TopProducersBySubscribersMetric }),
  z.object({ name: z.literal('topProducers'), data: TopProducersMetric }),
  z.object({ name: z.literal('onboardedTenantsCount'), data: OnboardedTenantsCountMetric }),
  z.object({ name: z.literal('tenantDistribution'), data: TenantDistributionMetric }),
  z.object({ name: z.literal('tenantSignupsTrend'), data: TenantSignupsTrendMetric }),
  z.object({
    name: z.literal('onboardedTenantsCountByMacroCategories'),
    data: OnboardedTenantsCountByMacroCategoriesMetric,
  }),
])

export type Metric = z.infer<typeof Metric>
export type MetricName = Metric['name']
export type MetricData = Metric['data']
export type GetMetricData<T extends MetricName> = Extract<Metric, { name: T }>['data']
