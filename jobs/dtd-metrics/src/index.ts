import { ReadPreferenceMode } from 'mongodb'
import { AwsS3BucketClient, ReadModelClient, withExecutionTime } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { Metrics } from './models/metrics.model.js'
import { z } from 'zod'
import {
  getPublishedEServicesMetric,
  getPublishedEServicesByMacroCategoriesMetric,
  getTop10MostSubscribedEServicesMetric,
  getTop10MostSubscribedEServicesPerMacroCategoriesMetric,
  getTop10ProviderWithMostSubscriberMetric,
} from './services/index.js'

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

  log('Retrieving metrics...')

  const oldMetrics = z.optional(Metrics).parse(await bucket.getJSONData(env.FILENAME))

  const [
    publishedEServicesMetric,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  ] = await Promise.all([
    getPublishedEServicesMetric(oldMetrics, readModel),
    getPublishedEServicesByMacroCategoriesMetric(readModel),
    getTop10MostSubscribedEServicesMetric(readModel),
    getTop10MostSubscribedEServicesPerMacroCategoriesMetric(readModel),
    getTop10ProviderWithMostSubscriberMetric(readModel),
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
