import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { ReadPreferenceMode } from 'mongodb'
import { env } from './configs/env.js'
import { ReadModelQueriesService } from './services/read-model-queries.service.js'
import { arrayToNdjson, getNdjsonBucketKey, log, splitArrayIntoChunks } from './utils/helpers.utils.js'
import { DataType } from './models.js'

const exportTimestamp = new Date()

log.info('Program started')

log.info('Connecting to read model...')
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

const readModelQueries = new ReadModelQueriesService(readModel)

log.info('Fetching data from read model...')

const tenants = await readModelQueries.getTenants()
const eservices = await readModelQueries.getEServices()
const agreements = await readModelQueries.getAgreements()
const purposes = await readModelQueries.getPurposes()

await readModel.close()

log.info('Preparing data for export...')

function preparaDataForExport(data: object[]): string[] {
  // Add export timestamp to data
  const dataWithTimestamp = data.map((item) => ({ ...item, exportTimestamp }))
  // Split data into chunks of 1000 items
  const dataChunks = splitArrayIntoChunks(dataWithTimestamp, 1000)

  // Convert each chunk to ndjson format
  return dataChunks.map(arrayToNdjson)
}

const dataToExport: [DataType, string[]][] = [
  ['tenants', preparaDataForExport(tenants)],
  ['eservices', preparaDataForExport(eservices)],
  ['agreements', preparaDataForExport(agreements)],
  ['purposes', preparaDataForExport(purposes)],
]

log.info(`Uploading data to ${env.DATALAKE_STORAGE_BUCKET} bucket...`)

const s3Bucket = new AwsS3BucketClient(env.DATALAKE_STORAGE_BUCKET)
for (const [dataType, ndjsonFiles] of dataToExport) {
  for (const ndjson of ndjsonFiles) {
    const bucketKey = getNdjsonBucketKey(dataType, exportTimestamp)
    await s3Bucket.uploadData(bucketKey, ndjson)
  }
}

log.info('Done!')
