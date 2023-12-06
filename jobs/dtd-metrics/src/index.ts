import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { MetricsOutput } from './models/metrics.model.js'
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

  const output = MetricsOutput.parse({
    // --- FIRST BATCH ---
    publishedEServices: await wrapPromiseWithLogs(getPublishedEServicesMetric(readModel), 'publishedEServices'),
    eservicesByMacroCategories: await wrapPromiseWithLogs(
      getEServicesByMacroCategoriesMetric(readModel, globalStore),
      'eservicesByMacroCategories'
    ),
    mostSubscribedEServices: await wrapPromiseWithLogs(
      getMostSubscribedEServicesMetric(readModel, globalStore),
      'mostSubscribedEServices'
    ),
    topProducersBySubscribers: await wrapPromiseWithLogs(
      getTopProducersBySubscribersMetric(readModel, globalStore),
      'topProducersBySubscribers'
    ),
    topProducers: await wrapPromiseWithLogs(getTopProducersMetric(readModel), 'topProducers'),
    // --- SECOND BATCH ---
    // onboardedTenantsCount: await wrapPromiseWithLogs(
    //   getOnboardedTenantsCountMetric(globalStore),
    //   'onboardedTenantsCount'
    // ),
    // onboardedTenantsCount: await wrapPromiseWithLogs(
    //   getTenantDistributionMetric(readModel, globalStore),
    //   'tenantDistribution'
    // ),
    // tenantSignupsTrend: await wrapPromiseWithLogs(getTenantSignupsTrendMetric(globalStore), 'tenantSignupsTrend'),
    // onboardedTenantsCountByMacroCategories: await wrapPromiseWithLogs(
    //   getOnboardedTenantsCountByMacroCategoriesMetric(globalStore),
    //   'onboardedTenantsCountByMacroCategories'
    // ),
  } satisfies MetricsOutput)

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
