import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { MetricsOutput, MetricsQueriesResult } from './models/metrics.model.js'
import {
  getPublishedEServicesMetric,
  getEServicesByMacroCategoriesMetric,
  getMostSubscribedEServicesMetric,
  getTopProducersBySubscribersMetric,
  getOnboardedTenantsCountMetric,
  getTenantDistributionMetric,
  getTenantSignupsTrendMetric,
  getOnboardedTenantsCountByMacroCategoriesMetric,
  getTopProducersMetric,
} from './services/index.js'
import { GithubClient } from './services/github-client.service.js'
import { wrapPromiseWithLogs } from './utils/helpers.utils.js'
import { GlobalStoreService } from './services/global-store.service.js'

const log = console.log

let readModel: ReadModelClient

async function main(): Promise<void> {
  log('Starting program\n')

  readModel = await ReadModelClient.connect({
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

  const githubClient = new GithubClient(env.GITHUB_ACCESS_TOKEN)
  const awsS3BucketClient = new AwsS3BucketClient(env.STORAGE_BUCKET)

  log('Retrieving metrics...')

  log('Initializing global store...')
  const globalStore = await GlobalStoreService.init(readModel)
  log('Global store initialized!\n')

  const queriesResult: MetricsQueriesResult = await Promise.all([
    wrapPromiseWithLogs(getPublishedEServicesMetric(readModel), 'publishedEServices'),
    wrapPromiseWithLogs(getEServicesByMacroCategoriesMetric(readModel), 'eservicesByMacroCategories'),
    wrapPromiseWithLogs(getMostSubscribedEServicesMetric(readModel, globalStore), 'mostSubscribedEServices'),
    wrapPromiseWithLogs(getTopProducersBySubscribersMetric(readModel, globalStore), 'topProducersBySubscribers'),
    wrapPromiseWithLogs(getOnboardedTenantsCountMetric(globalStore), 'onboardedTenantsCount'),
    wrapPromiseWithLogs(getTenantDistributionMetric(readModel, globalStore), 'tenantDistribution'),
    wrapPromiseWithLogs(getTenantSignupsTrendMetric(globalStore), 'tenantSignupsTrend'),
    wrapPromiseWithLogs(
      getOnboardedTenantsCountByMacroCategoriesMetric(readModel, globalStore),
      'onboardedTenantsCountByMacroCategories'
    ),
    wrapPromiseWithLogs(getTopProducersMetric(readModel), 'topProducers'),
  ])

  const output = MetricsOutput.parse(queriesResult)

  log(`\nUploading to ${env.STORAGE_BUCKET}/${env.FILENAME}...`)

  await Promise.all([
    githubClient.createOrUpdateRepoFile(output, env.GITHUB_REPO_OWNER, env.GITHUB_REPO, `data/${env.FILENAME}`),
    awsS3BucketClient.uploadData(output, env.FILENAME),
  ])

  log('Done!\n')
}

withExecutionTime(main).finally(async () => {
  if (readModel) await readModel.close()
})
