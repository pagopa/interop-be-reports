import { AwsS3BucketClient, ReadModelClient } from '@interop-be-reports/commons'
import { ReadPreferenceMode } from 'mongodb'
import { env } from './configs/env.js'
import { ReadModelQueriesService } from './services/read-model-queries.service.js'
import {
  addExportTimestampToData,
  arrayToNdjson,
  getNdjsonBucketKey,
  splitArrayIntoChunks,
} from './utils/helpers.utils.js'
import { DataType } from './models.js'

const exportTimestamp = new Date()

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

const tenants = await readModelQueries.getOnboardedTenants()
const eservices = await readModelQueries.getEServices()
const agreements = await readModelQueries.getAgreements()
const purposes = await readModelQueries.getPurposes()

await readModel.close()

const s3Bucket = new AwsS3BucketClient(env.DATALAKE_STORAGE_BUCKET)

function preparaDataForExport(data: unknown[]): string[] {
  // Add export timestamp to data and split it into chunks of 1000
  const dataWithTimestamp = addExportTimestampToData(data, exportTimestamp)
  const dataChunks = splitArrayIntoChunks(dataWithTimestamp, 1000)

  // Convert each chunk to NDJSON format
  return dataChunks.map(arrayToNdjson)
}

const dataToExport: [DataType, string[]][] = [
  ['tenants', preparaDataForExport(tenants)],
  ['eservices', preparaDataForExport(eservices)],
  ['agreements', preparaDataForExport(agreements)],
  ['purposes', preparaDataForExport(purposes)],
]

for (const [dataType, ndjsonFiles] of dataToExport) {
  for (const ndjson of ndjsonFiles) {
    const bucketKey = getNdjsonBucketKey(dataType, exportTimestamp)
    await s3Bucket.uploadData(bucketKey, ndjson)
  }
}
