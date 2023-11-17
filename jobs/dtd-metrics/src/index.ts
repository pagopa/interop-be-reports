import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import {
  publishedEServicesMetric,
  eservicesByMacroCategoriesMetric,
  mostSubscribedEServicesMetric,
  topProducersBySubscribersMetric,
  topProducersMetric,
  // onboardedTenantsCountMetric,
  // tenantDistributionMetric,
  // tenantSignupsTrendMetric,
  // onboardedTenantsCountByMacroCategoriesMetric,
} from './metrics/index.js'
import { GithubClient, GlobalStoreService } from './services/index.js'
import { produceMetrics } from './utils/helpers.utils.js'

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

  const output = await produceMetrics(readModel, globalStore, [
    // --- FIRST BATCH ---
    publishedEServicesMetric,
    eservicesByMacroCategoriesMetric,
    mostSubscribedEServicesMetric,
    topProducersBySubscribersMetric,
    topProducersMetric,
    // --- SECOND BATCH ---
    // onboardedTenantsCountMetric,
    // tenantDistributionMetric,
    // tenantSignupsTrendMetric,
    // onboardedTenantsCountByMacroCategoriesMetric,
  ])

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
