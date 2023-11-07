import { z } from 'zod'

export const PublishedEServicesMetric = z.object({
  publishedEServicesCount: z.number(),
  lastMonthPublishedEServicesCount: z.number(),
  variation: z.number(),
})

export const PublishedEServicesByMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    publishedEServicesCount: z.number(),
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

export const Top10MostSubscribedEServices = timedMetricObject(
  z.array(
    z.object({
      eserviceName: z.string(),
      tenantName: z.string(),
      count: z.number(),
    })
  )
)

export const Top10MostSubscribedEServicesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    top10MostSubscribedEServices: Top10MostSubscribedEServices,
  })
)

export const Top10ProviderWithMostSubscriberMetric = timedMetricObject(
  z.array(
    z.object({
      name: z.string(),
      topSubscribers: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          agreementsCount: z.number(),
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

export const Metrics = z.object({
  publishedEServicesMetric: PublishedEServicesMetric,
  macroCategoriesPublishedEServicesMetric: PublishedEServicesByMacroCategoriesMetric,
  top10MostSubscribedEServicesMetric: Top10MostSubscribedEServicesMetric,
  top10ProviderWithMostSubscriberMetric: Top10ProviderWithMostSubscriberMetric,
  onboardedTenantsCountMetric: OnboardedTenantsCountMetric,
  tenantDistributionMetric: TenantDistributionMetric,
  tenantSignupsTrendMetric: TenantSignupsTrendMetric,
})

export type Metrics = z.infer<typeof Metrics>

export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>
export type PublishedEServicesByMacroCategoriesMetric = z.infer<typeof PublishedEServicesByMacroCategoriesMetric>
export type Top10MostSubscribedEServices = z.infer<typeof Top10MostSubscribedEServices>
export type Top10MostSubscribedEServicesMetric = z.infer<typeof Top10MostSubscribedEServicesMetric>
export type Top10ProviderWithMostSubscriberMetric = z.infer<typeof Top10ProviderWithMostSubscriberMetric>
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>
export type TenantSignupsTrendMetric = z.infer<typeof TenantSignupsTrendMetric>
export type OnboardedTenantsCountByMacroCategoriesMetric = z.infer<typeof OnboardedTenantsCountByMacroCategoriesMetric>
