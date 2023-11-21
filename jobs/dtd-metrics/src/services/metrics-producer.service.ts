import { ReadModelClient } from '@interop-be-reports/commons'
import { MetricsOutput } from '../models/metrics.model.js'
import { GlobalStoreService } from './global-store.service.js'
import { writeFileSync } from 'fs'

export type MetricFactoryFn<TMetricKey extends keyof MetricsOutput> = (
  readModel: ReadModelClient,
  globalStore: GlobalStoreService
) => Promise<MetricsOutput[TMetricKey]>

type MetricObj<TMetricKey extends keyof MetricsOutput> = {
  name: TMetricKey
  factoryFn: MetricFactoryFn<TMetricKey>
}

type ProduceOutputOptions = {
  produceJSON?: boolean
  filter?: string
}

export class MetricsProducerService {
  private metrics: Array<MetricObj<keyof MetricsOutput>> = []

  constructor(
    private readModel: ReadModelClient,
    private globalStore: GlobalStoreService
  ) {}

  public addMetric<TMetricKey extends keyof MetricsOutput, TMetricFactoryFn extends MetricFactoryFn<TMetricKey>>(
    metricName: TMetricKey,
    metricFactory: TMetricFactoryFn
  ): MetricsProducerService {
    this.metrics.push({
      name: metricName,
      factoryFn: this.wrapFactoryFnWithLogs(metricName, metricFactory),
    })

    return this
  }

  public async produceOutput({
    produceJSON,
    filter,
  }: ProduceOutputOptions): Promise<MetricsOutput | Partial<MetricsOutput>> {
    const metricsOutput: Record<string, unknown> = {}

    for (const metricObj of this.metrics) {
      // If a filter is specified, skip the metric if its name does not include the filter
      if (filter && !metricObj.name.includes(filter)) continue
      metricsOutput[metricObj.name] = await metricObj.factoryFn(this.readModel, this.globalStore)
    }

    const output = filter ? MetricsOutput.partial().parse(metricsOutput) : MetricsOutput.parse(metricsOutput)

    if (produceJSON) {
      writeFileSync('output.json', JSON.stringify(output, null, 2))
    }

    return output
  }

  private wrapFactoryFnWithLogs<
    TMetricKey extends keyof MetricsOutput,
    TMetricFactoryFn extends MetricFactoryFn<TMetricKey>,
  >(metricName: TMetricKey, metricFactory: TMetricFactoryFn): MetricFactoryFn<TMetricKey> {
    return async (readModel, globalStore) => {
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
    }
  }
}