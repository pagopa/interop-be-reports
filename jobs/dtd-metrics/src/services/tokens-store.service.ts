import { isMainThread, parentPort, workerData } from 'worker_threads'
import { fileURLToPath } from 'url'
import { createWorker, log, splitArrayIntoChunks } from '../utils/helpers.utils.js'
import os from 'os'
import { z } from 'zod'
import { AwsS3BucketClient } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'

const THREAD_COUNT = os.cpus().length - 1
const MAX_GET_S3_OBJECTS_PARALLELISM = 100
const WORKER_FILE_PATH = fileURLToPath(import.meta.url)

const s3 = new AwsS3BucketClient(env.TOKENS_STORAGE_BUCKET)

const Token = z.object({
  agreementId: z.string(),
  algorithm: z.string(),
  audience: z.string(),
  clientAssertion: z.object({
    algorithm: z.string(),
    audience: z.string(),
    expirationTime: z.coerce.date(),
    issuedAt: z.coerce.date(),
    issuer: z.string(),
    jwtId: z.string(),
    keyId: z.string(),
    subject: z.string(),
  }),
  clientId: z.string(),
  descriptorId: z.string(),
  eserviceId: z.string(),
  expirationTime: z.coerce.date(),
  issuedAt: z.coerce.date(),
  issuer: z.string(),
  jwtId: z.string(),
  keyId: z.string(),
  notBefore: z.coerce.date(),
  organizationId: z.string(),
  purposeId: z.string(),
  purposeVersionId: z.string(),
  subject: z.string(),
})

const WorkerData = z.object({
  paths: z.array(z.string()),
  workerId: z.number(),
})

/**
 * This class is a singleton that stores all the tokens issued by the platform.
 * The tokens are retrieved from the S3 bucket and stored in memory.
 * This is done to avoid having to retrieve all the tokens from S3 every time a metric is requested.
 * The tokens are retrieved from S3 in parallel, using multiple threads.
 * The number of threads is equal to the number of CPU cores minus 1.
 * Each thread retrieves a chunk of the tokens from S3 and returns them to the main thread.
 * The main thread then merges all the chunks and stores the tokens in memory.
 */
export class TokensStore {
  private static instance: TokensStore | undefined
  private constructor(public tokens: Array<Date>) {}

  static async getInstance(): Promise<TokensStore> {
    if (this.instance) return this.instance

    log.info('> Retrieving tokens! Getting tokens data paths...')
    const paths = await s3.getBucketContentList()
    log.info(`> Found ${paths.length} paths!`)

    // Split the paths array into chunks to be processed by the threads
    const pathsChunks = splitArrayIntoChunks(paths, Math.ceil(paths.length / THREAD_COUNT))
    // Create a thread for each chunk, passing the chunk as workerData
    // The thread will run the code at the bottom of this file, in the `if (!isMainThread)` block
    log.info(`> Creating ${pathsChunks.length} worker threads...`)

    const workerPromises = pathsChunks.map((chunk, i) =>
      createWorker<Array<Date>>(WORKER_FILE_PATH, { paths: chunk, workerId: i })
    )
    const threadResults = await Promise.all(workerPromises)
    const tokens = threadResults.flat().sort((a, b) => a.getTime() - b.getTime())

    log.info(`> All worker threads finished! ${tokens.length} tokens found!`)
    this.instance = new TokensStore(tokens)
    return this.instance
  }
}

async function getTokensDataFromPath(path: string): Promise<Array<Date>> {
  const file = await s3.getData(path)

  if (!file) throw new Error(`File not found: ${path}`)

  const getIssuedAtDate = (token: string): Date => Token.parse(JSON.parse(token)).issuedAt
  return file.split('\n').map(getIssuedAtDate)
}

// The code inside this if block will be executed by the threads created above
if (!isMainThread) {
  const { paths, workerId } = WorkerData.parse(workerData)

  log.info(`> [Thread ${workerId}] Started!`)
  const issuedAtDatesResults: Date[][] = []

  const chunkSize = Math.max(1, Math.floor(MAX_GET_S3_OBJECTS_PARALLELISM / THREAD_COUNT))
  const pathsChunks = splitArrayIntoChunks(paths, chunkSize)

  for (let i = 0; i < pathsChunks.length; i++) {
    const pathChunk = pathsChunks[i]
    const issuedAtDatesResult = await Promise.all(pathChunk.map(getTokensDataFromPath))
    issuedAtDatesResults.push(...issuedAtDatesResult)

    if (i % 5 === 0 || issuedAtDatesResults.length === paths.length)
      log.info(`> [Thread ${workerId}] Processed ${issuedAtDatesResults.length} out of ${paths.length} paths`)
  }
  parentPort?.postMessage(issuedAtDatesResults.flat())
}
