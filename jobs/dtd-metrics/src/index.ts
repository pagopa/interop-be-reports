import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import {
  getPublishedEServicesMetric,
  getEServicesByMacroCategoriesMetric,
  getMostSubscribedEServicesMetric,
  getTopProducersBySubscribersMetric,
  getTopProducersMetric,
  // getOnboardedTenantsCountMetric,
  // getTenantDistributionMetric,
  // getTenantSignupsTrendMetric,
  // getOnboardedTenantsCountByMacroCategoriesMetric,
} from './metrics/index.js'
import { GithubClient, GlobalStoreService } from './services/index.js'
import { MetricsProducerService } from './services/metrics-producer.service.js'
import { log } from './utils/helpers.utils.js'
import { MetricsOutputFormatterService } from './services/metrics-output-formatter.service.js'
import { writeFileSync } from 'fs'

log.info('Starting program...')

const readModel = await ReadModelClient.connect({
  mongodbReplicaSet: env.MONGODB_REPLICA_SET,
  mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
  mongodbReadPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
  mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
  readModelDbHost: env.READ_MODEL_DB_HOST,
  readModelDbPort: env.READ_MODEL_DB_PORT,
  readModelDbUser: env.READ_MODEL_DB_USER,
  readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
  readModelDbName: env.READ_MODEL_DB_NAME,
})

try {
  const githubClient = new GithubClient(env.GITHUB_ACCESS_TOKEN)
  const awsS3BucketClient = new AwsS3BucketClient(env.STORAGE_BUCKET)

  log.info('Initializing global store...')
  const globalStore = await GlobalStoreService.init(readModel, { cache: env.CACHE_GLOBAL_STORE })
  log.info('Global store initialized!')

  log.info('Producing metrics...')

  const metrics = await new MetricsProducerService(readModel, globalStore)
    .addMetric('publishedEServices', getPublishedEServicesMetric)
    .addMetric('eservicesByMacroCategories', getEServicesByMacroCategoriesMetric)
    .addMetric('mostSubscribedEServices', getMostSubscribedEServicesMetric)
    .addMetric('topProducersBySubscribers', getTopProducersBySubscribersMetric)
    .addMetric('topProducers', getTopProducersMetric)
    // .addMetric('onboardedTenantsCount', getOnboardedTenantsCountMetric)
    // .addMetric('tenantDistribution', getTenantDistributionMetric)
    // .addMetric('tenantSignupsTrend', getTenantSignupsTrendMetric)
    // .addMetric('onboardedTenantsCountByMacroCategories', getOnboardedTenantsCountByMacroCategoriesMetric)
    .produceMetrics({
      filter: env.METRICS_FILTER,
    })

  log.info(`Uploading files...`)

  const metricsOutputFormatter = new MetricsOutputFormatterService(metrics)

  const dashboardOuput = metricsOutputFormatter.getMetricsDashboardData()
  const dtdFilesOutput = metricsOutputFormatter.getDtdMetricsFiles()

  if (env.PRODUCE_OUTPUT_JSON) {
    writeFileSync('dtd-metrics.json', JSON.stringify(dashboardOuput, null, 2))
  }

  for (const { filename, data } of dtdFilesOutput) {
    await githubClient.createOrUpdateRepoFile(data, env.GITHUB_REPO_OWNER, env.GITHUB_REPO, `data/${filename}`)
    writeFileSync(`${filename}`, data)
  }

  await awsS3BucketClient.uploadData(dashboardOuput, env.FILENAME)

  log.info('Done!')
} catch (err) {
  log.error('An error occurred while producing metrics:', err as Error)
} finally {
  await readModel.close()
}
