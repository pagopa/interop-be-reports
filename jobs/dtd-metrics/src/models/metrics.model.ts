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

export const OnboardedTenantsCountMetric = z.object({
  totalTenantsCount: z.number(),
  lastMonthTenantsCount: z.number(),
  variation: z.number(),
})

export const TenantDistributionMetric = z.array(
  z.object({
    label: z.enum(['Solo fruitore', 'Solo erogatore', 'Sia fruitore che erogatore', 'Solo primo accesso']),
    count: z.number(),
  })
)

export const OnboardedTenantsCountByMacroCategoriesMetric = timedMetricObject(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      oboardedCount: z.number(),
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

export const Metrics = z.object({
  publishedEServicesMetric: PublishedEServicesMetric,
  macroCategoriesPublishedEServicesMetric: PublishedEServicesByMacroCategoriesMetric,
  mostSubscribedEServices: MostSubscribedEServicesMetric,
  topProducersBySubscribers: TopProducersBySubscribersMetric,
  onboardedTenantsCountMetric: OnboardedTenantsCountMetric,
  tenantDistributionMetric: TenantDistributionMetric,
  tenantSignupsTrendMetric: TenantSignupsTrendMetric,
  onboardedTenantsCountByMacroCategoriesMetric: OnboardedTenantsCountByMacroCategoriesMetric,
  topProducers: TopProducersMetric,
})

export type Metrics = z.infer<typeof Metrics>

export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>
export type EServicesByMacroCategoriesMetric = z.infer<typeof EServicesByMacroCategoriesMetric>
export type MostSubscribedEServices = z.infer<typeof MostSubscribedEServices>
export type MostSubscribedEServicesMetric = z.infer<typeof MostSubscribedEServicesMetric>
export type TopProducersBySubscribersMetric = z.infer<typeof TopProducersBySubscribersMetric>
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>
export type TenantSignupsTrendMetric = z.infer<typeof TenantSignupsTrendMetric>
export type OnboardedTenantsCountByMacroCategoriesMetric = z.infer<typeof OnboardedTenantsCountByMacroCategoriesMetric>
