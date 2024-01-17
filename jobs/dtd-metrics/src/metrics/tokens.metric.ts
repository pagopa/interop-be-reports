import { MetricFactoryFn } from '../services/metrics-producer.service.js'
import { isMainThread, parentPort, workerData } from 'worker_threads'
import { fileURLToPath } from 'url'
import {
  createWorker,
  getMonthsAgoDate,
  getVariationPercentage,
  log,
  splitArrayIntoChunks,
  toTimeseriesSequenceData,
} from '../utils/helpers.utils.js'
import os from 'os'
import { z } from 'zod'
import { AwsS3BucketClient } from '@interop-be-reports/commons'
import { TokensMetric } from '../models/metrics.model.js'
import { env } from '../configs/env.js'

const THREAD_COUNT = os.cpus().length - 1
const MAX_GET_S3_OBJECTS_PARALLELISM = 100
const WORKER_FILE_PATH = fileURLToPath(import.meta.url)

const s3 = new AwsS3BucketClient(env.TOKENS_STORAGE_BUCKET)

export const getTokensMetric: MetricFactoryFn<'utilizzo'> = async () => {
  log.info('> > Getting tokens data paths...')
  const paths = await s3.getBucketContentList()
  log.info(`> > Found ${paths.length} paths!`)

  // Split the paths array into chunks to be processed by the threads
  const pathsChunks = splitArrayIntoChunks(paths, Math.ceil(paths.length / THREAD_COUNT))

  // Create a thread for each chunk, passing the chunk as workerData
  // The thread will run the code at the bottom of this file, in the `if (!isMainThread)` block
  log.info(`> > Creating ${pathsChunks.length} worker threads...`)
  const workerPromises = pathsChunks.map((chunk, i) =>
    createWorker<Array<Date>>(WORKER_FILE_PATH, { paths: chunk, workerId: i })
  )
  const threadResults = await Promise.all(workerPromises)
  const issuedAtTokenDates = threadResults.flat().sort((a, b) => a.getTime() - b.getTime())
  log.info(`> > All worker threads finished! ${issuedAtTokenDates.length} tokens found! Processing data...`)

  const oneMonthAgo = getMonthsAgoDate(1)
  const sixMonthsAgo = getMonthsAgoDate(6)
  const twelveMonthsAgo = getMonthsAgoDate(12)

  const totalCount = issuedAtTokenDates.length
  const lastMonthCount = issuedAtTokenDates.filter((d) => d > oneMonthAgo).length
  const variation = getVariationPercentage(lastMonthCount, totalCount)

  return TokensMetric.parse({
    totaleRichiesteDiAccesso: {
      totalCount,
      lastMonthCount,
      variation,
    },
    attivitaDellaPiattaforma: {
      lastSixMonths: toTimeseriesSequenceData({
        oldestDate: sixMonthsAgo,
        jump: { days: 5 },
        data: issuedAtTokenDates,
      }),
      lastTwelveMonths: toTimeseriesSequenceData({
        oldestDate: twelveMonthsAgo,
        jump: { days: 10 },
        data: issuedAtTokenDates,
      }),
      fromTheBeginning: toTimeseriesSequenceData({
        oldestDate: issuedAtTokenDates[0],
        jump: { months: 1 },
        data: issuedAtTokenDates,
      }),
    },
  })
}

async function getTokensDataFromPath(path: string): Promise<Array<Date>> {
  const file = await s3.getData(path)

  if (!file) throw new Error(`File not found: ${path}`)

  function getIssuedAtDate(token: string): Date {
    const parsedToken = JSON.parse(token)
    const issuedAt = parsedToken.issuedAt
    return z
      .number()
      .transform((n) => {
        const date = new Date(n)
        date.setHours(0, 0, 0, 0)
        return date
      })
      .parse(issuedAt)
  }

  return file.split('\n').map(getIssuedAtDate)
}

// The code inside this if block will be executed by the threads created above
if (!isMainThread) {
  const { paths, workerId } = z
    .object({
      paths: z.array(z.string()),
      workerId: z.number(),
    })
    .parse(workerData)

  log.info(`> > > [Thread ${workerId}] Started!`)
  const issuedAtDatesResults: Date[][] = []

  const chunkSize = Math.max(1, Math.floor(MAX_GET_S3_OBJECTS_PARALLELISM / THREAD_COUNT))
  const pathsChunks = splitArrayIntoChunks(paths, chunkSize)

  for (let i = 0; i < pathsChunks.length; i++) {
    const pathChunk = pathsChunks[i]
    const issuedAtDatesResult = await Promise.all(pathChunk.map(getTokensDataFromPath))
    issuedAtDatesResults.push(...issuedAtDatesResult)
    if (i % 5 === 0 || issuedAtDatesResults.length === paths.length)
      log.info(`> > > [Thread ${workerId}] Processed ${issuedAtDatesResults.length} out of ${paths.length} paths`)
  }
  parentPort?.postMessage(issuedAtDatesResults.flat())
}
