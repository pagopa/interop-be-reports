import { MongoClient, MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { withExecutionTime } from '@interop-be-reports/commons'
import { MetricsManager } from './services/index.js'
import * as fs from 'fs'
import { env } from './configs/env.js'

const log = console.log

async function main() {
  log('Starting program')

  const connectionConfig = {
    replicaSet: env.MONGODB_REPLICA_SET,
    directConnection: env.MONGODB_DIRECT_CONNECTION,
    readPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
    retryWrites: env.MONGODB_RETRY_WRITES,
  } satisfies MongoClientOptions

  const connectionString = `mongodb://${env.READ_MODEL_DB_USER}:${env.READ_MODEL_DB_PASSWORD}@${env.READ_MODEL_DB_HOST}:${env.READ_MODEL_DB_PORT}`
  const client = await new MongoClient(connectionString, connectionConfig).connect()

  const metricsManager = new MetricsManager(client)

  const [
    publishedEServicesMetric,
    macroCategoriesPublishedEServicesMetric,
    top10MostSubscribedEServicesMetric,
    top10MostSubscribedEServicesPerMacroCategoryMetric,
    top10ProviderWithMostSubscriberMetric,
  ] = await Promise.all([
    metricsManager.getPublishedEServicesMetric(),
    metricsManager.getMacroCategoriesPublishedEServicesMetric(),
    metricsManager.getTop10MostSubscribedEServicesMetric(),
    metricsManager.getTop10MostSubscribedEServicesPerMacroCategoryMetric(),
    metricsManager.getTop10ProviderWithMostSubscriberMetric(),
  ])

  fs.writeFileSync(
    'output.json',
    JSON.stringify(
      {
        publishedEServicesMetric,
        macroCategoriesPublishedEServicesMetric,
        top10MostSubscribedEServicesMetric,
        top10MostSubscribedEServicesPerMacroCategoryMetric,
        top10ProviderWithMostSubscriberMetric,
      },
      null,
      2
    )
  )
}

withExecutionTime(main)
