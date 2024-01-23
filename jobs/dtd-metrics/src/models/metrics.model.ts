import { z } from 'zod'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const TimedMetric = <T extends z.ZodType>(schema: T) =>
  z.object({
    lastSixMonths: schema,
    lastTwelveMonths: schema,
    fromTheBeginning: schema,
  })

type TimedMetricType<T extends z.ZodType> = ReturnType<typeof TimedMetric<T>>
export type TimedMetric<T = unknown> = z.infer<TimedMetricType<z.ZodType<T>>>
export type TimedMetricKey = keyof TimedMetric

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

export const MostSubscribedEServicesMetric = TimedMetric(
  z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mostSubscribedEServices: z.array(
        z.object({
          eserviceName: z.string(),
          producerName: z.string(),
          subscribersCount: z.number(),
        })
      ),
    })
  )
)
export type MostSubscribedEServicesMetric = z.infer<typeof MostSubscribedEServicesMetric>

export const TopProducersBySubscribersMetric = TimedMetric(
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

export const TenantDistributionMetric = z.array(
  z.object({
    activity: z.enum(['Solo fruitore', 'Solo erogatore', 'Sia fruitore che erogatore', 'Solo accesso']),
    count: z.number(),
  })
)
export type TenantDistributionMetric = z.infer<typeof TenantDistributionMetric>

export const TenantOnboardingTrendMetric = z.array(z.object({ date: z.date(), count: z.number() }))
export type TenantOnboardingTrendMetric = z.infer<typeof TenantOnboardingTrendMetric>

export const MacroCategoriesOnboardingTrendMetric = TimedMetric(
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
export type MacroCategoriesOnboardingTrendMetric = z.infer<typeof MacroCategoriesOnboardingTrendMetric>

export const OnboardedTenantsCountMetric = z.tuple([
  z.object({
    name: z.literal('Totale enti'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal('Pubblici'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal('Privati'),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[2].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[6].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
  z.object({
    name: z.literal(MACRO_CATEGORIES[9].name),
    totalCount: z.number(),
    lastMonthCount: z.number(),
    variation: z.number(),
  }),
])
export type OnboardedTenantsCountMetric = z.infer<typeof OnboardedTenantsCountMetric>

export const TopProducersMetricItem = z.object({
  producerName: z.string(),
  count: z.number(),
})

export type TopProducersMetricItem = z.infer<typeof TopProducersMetricItem>

export const TopProducersMetric = TimedMetric(z.array(TopProducersMetricItem))
export type TopProducersMetric = z.infer<typeof TopProducersMetric>

export const Metric = z.union([
  z.object({ name: z.literal('totaleEnti'), data: OnboardedTenantsCountMetric }),
  z.object({ name: z.literal('andamentoDelleAdesioni'), data: TenantOnboardingTrendMetric }),
  z.object({ name: z.literal('statoDiCompletamentoAdesioni'), data: MacroCategoriesOnboardingTrendMetric }),
  z.object({ name: z.literal('distribuzioneDegliEntiPerAttivita'), data: TenantDistributionMetric }),
  z.object({ name: z.literal('eservicePubblicati'), data: PublishedEServicesMetric }),
  z.object({ name: z.literal('entiErogatoriDiEService'), data: EServicesByMacroCategoriesMetric }),
  z.object({ name: z.literal('entiChePubblicanoPiuEService'), data: TopProducersMetric }),
  z.object({ name: z.literal('entiErogatoriEdEntiAbilitatiAllaFruizione'), data: TopProducersBySubscribersMetric }),
  z.object({ name: z.literal('eserviceConPiuEntiAbilitati'), data: MostSubscribedEServicesMetric }),
])

export type Metric = z.infer<typeof Metric>
export type MetricName = Metric['name']
export type MetricData = Metric['data']
export type GetMetricData<T extends MetricName> = Extract<Metric, { name: T }>['data']
