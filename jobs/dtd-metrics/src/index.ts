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
  // getTenantOnboardingTrendMetric,
  // getOnboardedTenantsCountByMacroCategoriesMetric,
} from './metrics/index.js'
import { GithubClient, GlobalStoreService } from './services/index.js'
import { MetricsProducerService } from './services/metrics-producer.service.js'
import { log } from './utils/helpers.utils.js'
import { writeFile } from 'fs/promises'

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

  const output = await new MetricsProducerService(readModel, globalStore)
    .addMetric('publishedEServices', getPublishedEServicesMetric)
    .addMetric('eservicesByMacroCategories', getEServicesByMacroCategoriesMetric)
    .addMetric('mostSubscribedEServices', getMostSubscribedEServicesMetric)
    .addMetric('topProducersBySubscribers', getTopProducersBySubscribersMetric)
    .addMetric('topProducers', getTopProducersMetric)
    // .addMetric('onboardedTenantsCount', getOnboardedTenantsCountMetric)
    // .addMetric('tenantDistribution', getTenantDistributionMetric)
    // .addMetric('tenantOnboardingTrend', getTenantOnboardingTrendMetric)
    // .addMetric('onboardedTenantsCountByMacroCategories', getOnboardedTenantsCountByMacroCategoriesMetric)
    .produceOutput({
      filter: env.METRICS_FILTER,
    })

  log.info(`Uploading to ${env.STORAGE_BUCKET}/${env.FILENAME}...`)

  await Promise.all([
    // If PRODUCE_OUTPUT_JSON is true, write the output to a local file
    ...(env.PRODUCE_OUTPUT_JSON ? [writeFile('dtd-metrics.json', JSON.stringify(output, null, 2))] : []),
    githubClient.createOrUpdateRepoFile(output, env.GITHUB_REPO_OWNER, env.GITHUB_REPO, `data/${env.FILENAME}`),
    awsS3BucketClient.uploadData(output, env.FILENAME),
  ])

  log.info('Done!')
} catch (err) {
  log.error('An error occurred while producing metrics:', err as Error)
} finally {
  await readModel.close()
}
