import { z } from 'zod'

export const PublishedEServicesMetric = z.object({
  publishedEServicesCount: z.number(),
  lastMonthPublishedEServicesCount: z.number(),
  variation: z.string(),
})

export const MacroCategoriesPublishedEServicesMetric = z.array(
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

export const Top10MostSubscribedEServicesPerMacroCategoryMetric = z.array(
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
  macroCategoriesPublishedEServicesMetric: MacroCategoriesPublishedEServicesMetric,
  top10MostSubscribedEServicesMetric: Top10MostSubscribedEServicesMetric,
  top10MostSubscribedEServicesPerMacroCategoryMetric: Top10MostSubscribedEServicesPerMacroCategoryMetric,
  top10ProviderWithMostSubscriberMetric: Top10ProviderWithMostSubscriberMetric,
})

export type Metrics = z.infer<typeof Metrics>

export type PublishedEServicesMetric = z.infer<typeof PublishedEServicesMetric>
export type MacroCategoriesPublishedEServicesMetric = z.infer<typeof MacroCategoriesPublishedEServicesMetric>
export type Top10MostSubscribedEServicesMetric = z.infer<typeof Top10MostSubscribedEServicesMetric>
export type Top10MostSubscribedEServicesPerMacroCategoryMetric = z.infer<
  typeof Top10MostSubscribedEServicesPerMacroCategoryMetric
>
export type Top10ProviderWithMostSubscriberMetric = z.infer<typeof Top10ProviderWithMostSubscriberMetric>
