import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { MetricsManager } from './services/index.js'
import { env } from './configs/env.js'
import { Metrics } from './models/metrics.model.js'
import { z } from 'zod'

const log = console.log

async function main(): Promise<void> {
  log('Starting program\n')

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

  const bucket = new AwsS3BucketClient(env.STORAGE_BUCKET)
  const metricsManager = new MetricsManager(readModel)

  log('Retrieving metrics...')

  const oldMetrics = z.optional(Metrics).parse(await bucket.getJSONData(env.FILENAME))

  const [
    publishedEServicesMetric,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  ] = await Promise.all([
    metricsManager.getPublishedEServicesMetric(oldMetrics),
    metricsManager.getMacroCategoriesPublishedEServicesMetric(),
    metricsManager.getTop10MostSubscribedEServicesMetric(),
    metricsManager.getTop10MostSubscribedEServicesPerMacroCategoryMetric(),
    metricsManager.getTop10ProviderWithMostSubscriberMetric(),
  ])

  log('Metrics retrieved!\n')
  log(`Uploading to ${env.STORAGE_BUCKET}/${env.FILENAME}...`)

  const output = Metrics.parse({
    publishedEServicesMetric,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  })

  await bucket.uploadData(output, env.FILENAME)

  log('Done!\n')

  await readModel.close()
  process.exit(0)
}

withExecutionTime(main)
