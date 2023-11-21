# dtd-metrics

This job is used to generate metrics and upload them into a bucked and a repo.

## How to create a new metric

1. Create the type model of the metric output in the `models/metrics.model.ts` file.
2. In the same file, add the created model in the `MetricsOutput` model type.
3. Create a new file in the `metrics` folder with the following format: `<metric-name>.metric.ts`.
4. Create a the function that produce the metric, typing with the `MetricFactoryFn` type, passing the metric name as type parameter.
5. Add the created metric to the `MetricsProducerService` class instance in the main `index.ts` file.
