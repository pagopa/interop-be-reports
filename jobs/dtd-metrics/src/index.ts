import { MongoClient, MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { withExecutionTime } from '@interop-be-reports/commons'
import { MetricsManager } from './services/index.js'
import { env } from './configs/env.js'
// import { Metrics } from './models/metrics.model.js'
// import { z } from 'zod'
import * as fs from 'fs'

const log = console.log

async function main(): Promise<void> {
  log('Starting program\n')

  const connectionConfig = {
    replicaSet: env.MONGODB_REPLICA_SET,
    directConnection: env.MONGODB_DIRECT_CONNECTION,
    readPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
    retryWrites: env.MONGODB_RETRY_WRITES,
  } satisfies MongoClientOptions

  const connectionString = `mongodb://${env.READ_MODEL_DB_USER}:${env.READ_MODEL_DB_PASSWORD}@${env.READ_MODEL_DB_HOST}:${env.READ_MODEL_DB_PORT}`
  const client = await new MongoClient(connectionString, connectionConfig).connect()

  // const bucket = new AwsS3BucketClient(env.STORAGE_BUCKET)
  const metricsManager = new MetricsManager(client)

  log('Retrieving metrics...')

  // const oldMetrics = z.optional(Metrics).parse(await bucket.getJSONData(env.FILENAME))

  // const top10MostSubscribedEServicesPerMacroCategoryMetric =
  //   await metricsManager.getTop10MostSubscribedEServicesPerMacroCategoryMetric()

  const [
    // publishedEServicesMetric,
    // macroCategoriesPublishedEServicesMetric,
    // top10MostSubscribedEServicesMetric,
    // top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  ] = await Promise.all([
    // metricsManager.getPublishedEServicesMetric(oldMetrics),
    // metricsManager.getPublishedEServicesMetric(undefined),
    // metricsManager.getMacroCategoriesPublishedEServicesMetric(),
    // metricsManager.getTop10MostSubscribedEServicesMetric(),
    // metricsManager.getTop10MostSubscribedEServicesPerMacroCategoryMetric(),
    metricsManager.getTop10ProviderWithMostSubscriberMetric(),
  ])

  log('Metrics retrieved!\n')
  log(`Uploading to ${env.STORAGE_BUCKET}/${env.FILENAME}...`)

  // const output = Metrics.parse({
  //   publishedEServicesMetric,
  //   macroCategoriesPublishedEServicesMetric,
  //   top10MostSubscribedEServicesMetric,
  //   top10MostSubscribedEServicesPerMacroCategoryMetric,
  //   top10ProviderWithMostSubscriberMetric,
  // })

  const output = {
    // publishedEServicesMetric,
    // macroCategoriesPublishedEServicesMetric,
    // top10MostSubscribedEServicesMetric,
    // top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  }

  log('Done!\n')

  fs.writeFileSync(env.FILENAME, JSON.stringify(output, null, 2))

  // await bucket.uploadData(output, env.FILENAME)
}

withExecutionTime(main)
