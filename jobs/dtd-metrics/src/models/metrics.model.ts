import { z } from 'zod'

export const PublishedEServicesMetric = z.object({
  publishedEServicesCount: z.number(),
  variation: z.string(),
})

export const PublishedEServicesByMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    publishedEServicesCount: z.number(),
  })
)

export const Top10MostSubscribedEServicesMetric = z.array(
  z.object({
    name: z.string(),
    producerName: z.string(),
    agreementsCount: z.number(),
  })
)

export const Top10MostSubscribedEServicesPerMacroCategoriesMetric = z.array(
  z.object({
    id: z.string(),
    name: z.string(),
    top10MostSubscribedEServices: Top10MostSubscribedEServicesMetric,
  })
)

export const Top10ProviderWithMostSubscriberMetric = z.array(
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

export const Metrics = z.object({
  publishedEServicesMetric: PublishedEServicesMetric,
  macroCategoriesPublishedEServicesMetric: PublishedEServicesByMacroCategoriesMetric,
  top10MostSubscribedEServicesMetric: Top10MostSubscribedEServicesMetric,
  top10MostSubscribedEServicesPerMacroCategoryMetric: Top10MostSubscribedEServicesPerMacroCategoriesMetric,
  top10ProviderWithMostSubscriberMetric: Top10ProviderWithMostSubscriberMetric,
})

export type Metrics = z.infer<typeof Metrics>

export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>
export type PublishedEServicesByMacroCategoriesMetric = z.infer<typeof PublishedEServicesByMacroCategoriesMetric>
export type Top10MostSubscribedEServicesMetric = z.infer<typeof Top10MostSubscribedEServicesMetric>
export type Top10MostSubscribedEServicesPerMacroCategoriesMetric = z.infer<
  typeof Top10MostSubscribedEServicesPerMacroCategoriesMetric
>
export type Top10ProviderWithMostSubscriberMetric = z.infer<typeof Top10ProviderWithMostSubscriberMetric>
