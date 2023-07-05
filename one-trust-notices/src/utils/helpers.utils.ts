import * as crypto from 'crypto'
import { AwsS3Client } from '../services/index.js'
import { env } from '../config/env.js'

/**
 * Get MD5 hash from file
 * @param file - File to get MD5 hash from
 * @returns MD5 hash
 */
export function getMD5HashFromFile(file: Buffer): string {
  return crypto.createHash('md5').update(file).digest('base64')
}

let bucketContentCache: string[] | undefined
/**
 * Check if the notice is a new version.
 * A notice is considered a new version if the bucket does not contain the notice history.
 * @param bucketPath The path of the notice in the bucket.
 * @returns
 */
export async function checkForNewVersion(awsS3Client: AwsS3Client, bucketPath: string) {
  if (!bucketContentCache) {
    bucketContentCache = await awsS3Client.getBucketContentList(env.HISTORY_STORAGE_BUCKET)
  }
  return !bucketContentCache.includes(bucketPath)
}
