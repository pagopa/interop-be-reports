import { GetMetricData, MetricName, Metric } from '../models/metrics.model.js'
import { toSnakeCase } from '../utils/helpers.utils.js'

type MetricsDashboardData = { [TMetricName in MetricName]: GetMetricData<TMetricName> }
type MetricFile = { filename: string; data: string }

export class MetricsOutputFormatterService {
  constructor(private metrics: Array<Metric>) {}

  public getMetricsDashboardData(): MetricsDashboardData {
    return this.metrics.reduce((acc, metric) => ({ ...acc, [metric.name]: metric.data }), {} as MetricsDashboardData)
  }

  public getDtdMetricsFiles(): Array<MetricFile> {
    return this.metrics.reduce(
      (acc, metric) => [...acc, ...this.getMetricJsonFiles(metric), ...this.getMetricCSVFiles(metric)],
      [] as Array<MetricFile>
    )
  }

  private getMetricJsonFiles(metric: Metric): Array<MetricFile> {
    switch (metric.name) {
      case 'publishedEServices':
      case 'eservicesByMacroCategories':
      case 'mostSubscribedEServices':
      case 'onboardedTenantsCount':
      case 'tenantDistribution':
        return [{ filename: `${toSnakeCase(metric.name)}.json`, data: JSON.stringify(metric.data) }]
      case 'topProducersBySubscribers':
      case 'topProducers':
      case 'tenantSignupsTrend':
      case 'onboardedTenantsCountByMacroCategories':
        type TimedMetricKey = keyof typeof metric.data
        return [
          {
            filename: `${toSnakeCase(metric.name)}_${toSnakeCase('fromTheBeginning' satisfies TimedMetricKey)}.json`,
            data: JSON.stringify(metric.data.fromTheBeginning),
          },
          {
            filename: `${toSnakeCase(metric.name)}_${toSnakeCase('lastSixMonths' satisfies TimedMetricKey)}.json`,
            data: JSON.stringify(metric.data.lastSixMonths),
          },
          {
            filename: `${toSnakeCase(metric.name)}_${toSnakeCase('lastTwelveMonths' satisfies TimedMetricKey)}.json`,
            data: JSON.stringify(metric.data.lastTwelveMonths),
          },
        ]
    }
  }

  private getMetricCSVFiles(_metric: Metric): Array<MetricFile> {
    return []
  }
}
