import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { env } from './configs/env.js'
import { ReadPreferenceMode } from 'mongodb'
import { getEServices, getTotalLoadEServices } from './services/read-model-queries.service.js'

const log = console.log

log('Process started')

log('Connecting to read model')
const readModelClient = await ReadModelClient.connect({
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

const awsS3BucketClient = new AwsS3BucketClient(env.STORAGE_BUCKET)

log('Getting e-service data...')
const eservices = await getEServices(readModelClient)

log('Getting e-service load data...')
const eserviceIds = eservices.map((eservice) => eservice.id)
const purposes = await getTotalLoadEServices(readModelClient, eserviceIds)

// Map purposes to a map of id -> actualLoad
const actualLoadMap = new Map<string, number>(purposes.map((purpose) => [purpose.id, purpose.actualLoad]))

// Enrich e-services with actual load
const result = eservices
  .map((eservice) => ({
    ...eservice,
    actualLoad: actualLoadMap.get(eservice.id) ?? 0, // If no purpose is found, set actual load to 0
  }))
  .sort((a, b) => b.actualLoad - a.actualLoad)

log(`Uploading data to ${env.STORAGE_BUCKET}...`)
await awsS3BucketClient.uploadData(result, env.FILENAME)

await readModelClient.close()

log('Done.')
