# dtd-metrics

This job is used to generate metrics and upload them into a bucked and a repo.

## How to create a new metric

1. Create the type model of the metric output in the `models/metrics.model.ts` file.
2. In the same file, add the created model in the `MetricsOutput` model type.
3. Create a new file in the `metrics` folder with the following format: `<metric-name>.metric.ts`.
4. Use the `createMetric` function to wrap the metric logic. The first parameter takes the metric name, it must be the same as the `MetricsOutput` key related to the new metric. As the second parameter it takes the metric "factory function" that must return the metric output. The metric output type is automatically inferred. The factory function takes the `readModel` and the `globalStore` as parameters.
5. Add the new metric file export in the `metrics/index.ts` file.
6. Add the created metric to the `produceMetricsOutput` function third parameter array in the main `index.ts` file.
