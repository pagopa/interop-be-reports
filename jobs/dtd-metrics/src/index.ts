import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { Metrics } from './models/metrics.model.js'
import {
  getPublishedEServicesMetric,
  getPublishedEServicesByMacroCategoriesMetric,
  getTop10MostSubscribedEServicesMetric,
  getTopProducersBySubscribersMetric,
  getOnboardedTenantsCountMetric,
  getTenantDistributionMetric,
  getTenantSignupsTrendMetric,
  getOnboardedTenantsCountByMacroCategoriesMetric,
  getTopProducersMetric,
} from './services/index.js'
import { GithubClient } from './services/github-client.service.js'
import { getMacroCategoriesWithAttributes, wrapPromiseWithLogs } from './utils/helpers.utils.js'

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

  /**
   * Preload macro categories with attributes, so we don't have to query the database for each metric that needs them.
   * The result is cached.
   */
  await getMacroCategoriesWithAttributes(readModel)

  const [
    publishedEServices,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    topProducersBySubscribers,
    onboardedTenantsCountMetric,
    tenantDistributionMetric,
    tenantSignupsTrendMetric,
    onboardedTenantsCountByMacroCategoriesMetric,
    topProducers,
  ] = await Promise.all([
    wrapPromiseWithLogs(getPublishedEServicesMetric(readModel), 'publishedEServicesMetric'),
    wrapPromiseWithLogs(
      getPublishedEServicesByMacroCategoriesMetric(readModel),
      'macroCategoriesPublishedEServicesMetric'
    ),
    wrapPromiseWithLogs(getTop10MostSubscribedEServicesMetric(readModel), 'top10MostSubscribedEServicesMetric'),
    wrapPromiseWithLogs(getTopProducersBySubscribersMetric(readModel), 'topProducersBySubscribers'),
    wrapPromiseWithLogs(getOnboardedTenantsCountMetric(readModel), 'onboardedTenantsCountMetric'),
    wrapPromiseWithLogs(getTenantDistributionMetric(readModel), 'tenantDistributionMetric'),
    wrapPromiseWithLogs(getTenantSignupsTrendMetric(readModel), 'tenantSignupsTrendMetric'),
    wrapPromiseWithLogs(
      getOnboardedTenantsCountByMacroCategoriesMetric(readModel),
      'onboardedTenantsCountByMacroCategoriesMetric'
    ),
    wrapPromiseWithLogs(getTopProducersMetric(readModel), 'topProducersMetric'),
  ])

  log(`\nUploading to ${env.STORAGE_BUCKET}/${env.FILENAME}...`)

  const output = Metrics.parse({
    publishedEServices,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    topProducersBySubscribers,
    onboardedTenantsCountMetric,
    tenantDistributionMetric,
    tenantSignupsTrendMetric,
    onboardedTenantsCountByMacroCategoriesMetric,
    topProducers,
  })

  await Promise.all([
    githubClient.createOrUpdateRepoFile(output, env.GITHUB_REPO_OWNER, env.GITHUB_REPO, `data/${env.FILENAME}`),
    awsS3BucketClient.uploadData(output, env.FILENAME),
  ])

  log('Done!\n')
}

withExecutionTime(main).finally(async () => {
  if (readModel) await readModel.close()
})
