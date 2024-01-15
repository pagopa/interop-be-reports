import { AwsS3BucketClient } from '@interop-be-reports/commons'
import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { isMainThread, parentPort, workerData } from 'worker_threads'
import { fileURLToPath } from 'url'
import { createWorker } from '../utils/helpers.utils.js'
import os from 'os'

const WORKER_FILE_PATH = fileURLToPath(import.meta.url)
const THREAD_COUNT = os.cpus().length - 1

export const getTokensMetric: MetricFactoryFn<'tokens'> = async () => {
  const s3 = new AwsS3BucketClient('interop-generated-jwt-details-dev')
  const paths = await s3.getBucketContentList()

  const chunks: string[][] = Array(THREAD_COUNT)
    .fill(null)
    .map(() => [])

  paths.forEach((path, index) => {
    chunks[index % THREAD_COUNT].push(path)
  })

  const workerPromises = Array.from({ length: THREAD_COUNT }).map((_, i) => createWorker(WORKER_FILE_PATH, chunks[i]))

  const threadResults = await Promise.all(workerPromises)
  const tokens = threadResults.flat(2)
  console.log(threadResults)
  console.log(tokens.length, threadResults.length)

  return {}
}

async function getTokensFromPath(path: string): Promise<unknown> {
  console.log(`Processing ${path}`)

  const s3 = new AwsS3BucketClient('interop-generated-jwt-details-dev')
  const file = await s3.getData(path)

  if (!file) {
    throw new Error(`File not found: ${path}`)
  }

  return file.split('\n').map((line) => JSON.parse(line))
}

if (!isMainThread) {
  const paths = workerData as string[]
  const tokens = await Promise.all(paths.map(getTokensFromPath))
  parentPort?.postMessage(tokens)
}
