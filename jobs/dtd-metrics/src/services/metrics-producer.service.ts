import { ReadModelClient } from '@interop-be-reports/commons'
import { GlobalStoreService } from './global-store.service.js'
import { log, timer } from '../utils/helpers.utils.js'
import { GetMetricData, MetricName, Metric } from '../models/metrics.model.js'
import { z } from 'zod'

export type MetricFactoryFn<
  TMetricName extends MetricName,
  TDataMetricData extends GetMetricData<TMetricName> = GetMetricData<TMetricName>,
> = (readModel: ReadModelClient, globalStore: GlobalStoreService) => Promise<TDataMetricData> | TDataMetricData

type MetricObj<TMetricName extends MetricName> = {
  name: TMetricName
  factoryFn: MetricFactoryFn<TMetricName>
}

type ProduceOutputOptions = {
  filter?: string
}

export class MetricsProducerService {
  private metrics: Array<MetricObj<MetricName>> = []

  constructor(
    private readModel: ReadModelClient,
    private globalStore: GlobalStoreService
  ) {}

  /**
   * Adds a metric to the metrics list.
   */
  public addMetric<TMetricName extends MetricName, TMetricFactoryFn extends MetricFactoryFn<TMetricName>>(
    metricName: TMetricName,
    metricFactory: TMetricFactoryFn
  ): MetricsProducerService {
    this.metrics.push({
      name: metricName,
      factoryFn: this.wrapFactoryFnWithLogs(metricName, metricFactory),
    })

    return this
  }

  /**
   * Executes all the metrics sequentially and returns Metrics array.
   * If a filter is specified, only the metrics whose name includes the filter will be executed.
   */
  public async produceMetrics({ filter }: ProduceOutputOptions): Promise<Array<Metric>> {
    const metricsOutput: Array<unknown> = []

    for (const metricObj of this.metrics) {
      // If a filter is specified, skip the metric if its name does not include the filter
      if (filter && !metricObj.name.includes(filter)) continue

      const metricData = await metricObj.factoryFn(this.readModel, this.globalStore)
      metricsOutput.push({ name: metricObj.name, data: metricData })
    }

    return z.array(Metric).parse(metricsOutput)
  }

  /**
   * Wraps a metric factory function with logs
   */
  private wrapFactoryFnWithLogs<TMetricName extends MetricName, TMetricFactoryFn extends MetricFactoryFn<TMetricName>>(
    metricName: TMetricName,
    metricFactory: TMetricFactoryFn
  ): MetricFactoryFn<TMetricName> {
    return async (readModel, globalStore) => {
      log.info(`> Starting ${metricName}...`)

      try {
        timer.start()
        const result = await metricFactory(readModel, globalStore)
        log.info(`> Done! ${metricName} finished executing in ${timer.stop()}s`)
        return result
      } catch (e) {
        log.error(`Error while executing ${metricName}`)
        throw e
      }
    }
  }
}
