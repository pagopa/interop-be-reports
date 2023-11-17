import { sub } from 'date-fns'
import { MetricsOutput } from '../models/metrics.model.js'
import { ReadModelClient } from '@interop-be-reports/commons'
import { GlobalStoreService } from '../services/global-store.service.js'

export function getMonthsAgoDate(numMonths: number): Date {
  return sub(new Date(), { months: numMonths })
}

export function getVariationPercentage(current: number, previous: number): number {
  return Number((previous === 0 ? 0 : ((current - previous) / previous) * 100).toFixed(1))
}

type MetricFactoryFn<TMetricKey extends keyof MetricsOutput> = (
  readModel: ReadModelClient,
  globalStore: GlobalStoreService
) => Promise<MetricsOutput[TMetricKey]>

type MetricObj<TMetricKey extends keyof MetricsOutput> = {
  name: TMetricKey
  factoryFn: MetricFactoryFn<TMetricKey>
}

/**
 * Utility function to wrap a metric with logs plus some type safety-ness for the metric output.
 * The metric factory output type is inferred from the MetricsOutput model.
 * @param metricName the name of the metric, it will be used for logging. It must be a key of MetricsOutput model type
 * @param metricFactory the factory function that will be called to compute the metric. It will receive the readModel and the globalStore as parameters
 *
 * @returns the metric object that can be used in the produceMetricsOutput function
 */
export function createMetric<TMetricKey extends keyof MetricsOutput>(
  metricName: TMetricKey,
  metricFactory: MetricFactoryFn<TMetricKey>
): MetricObj<TMetricKey> {
  return {
    name: metricName,
    factoryFn: async (readModel, globalStore): ReturnType<MetricFactoryFn<TMetricKey>> => {
      console.log(`> Starting ${metricName}...`)

      const timeLog = `> Done! ${metricName} finished executing in`
      console.time(timeLog)

      try {
        const result = await metricFactory(readModel, globalStore)
        console.timeEnd(timeLog)
        return result
      } catch (e) {
        console.error(`Error while executing ${metricName}`)
        throw e
      }
    },
  }
}

/**
 * Utility function to produce the metrics output from a list of metric objects.
 * Metrics factory functions will be executed sequentially.
 * @param readModel the readModel client
 * @param globalStore the globalStore service
 * @param metricObjs the list of metric objects to execute
 * @param filter an optional filter to only execute some metrics. If specified, the output will be a partial MetricsOutput
 *
 * @returns the metrics output
 */
export async function produceMetricsOutput(
  readModel: ReadModelClient,
  globalStore: GlobalStoreService,
  metricObjs: Array<MetricObj<keyof MetricsOutput>>,
  filter: string | undefined
): Promise<MetricsOutput | Partial<MetricsOutput>> {
  const metricsOutput: Record<string, unknown> = {}

  for (const metricObj of metricObjs) {
    // If a filter is specified, skip the metric if its name does not include the filter
    if (filter && !metricObj.name.includes(filter)) continue
    metricsOutput[metricObj.name] = await metricObj.factoryFn(readModel, globalStore)
  }

  if (filter) return MetricsOutput.partial().parse(metricsOutput)
  else return MetricsOutput.parse(metricsOutput)
}
