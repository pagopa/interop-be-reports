import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import * as crypto from 'crypto'

export class AwsS3BucketClient {
  private s3Client: S3Client

  constructor(private bucket: string) {
    this.s3Client = new S3Client({
      region: 'eu-central-1',
    })
  }

  /**
   * Uploads a JSON file to an S3 bucket.
   * @param data The data to be uploaded. The data will be stringified if it is not a string.
   * @param path The path in which the data will be stored in the bucket.
   */
  public async uploadData(data: string | unknown, path: string) {
    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data)
    const fileData = Buffer.from(stringifiedData)

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: path,
        Body: stringifiedData,
        ContentMD5: this.getMD5HashFromFile(fileData),
      })
    )
  }

  /**
   * Get the list of objects .
   * @returns The list of objects .
   * */
  async getBucketContentList() {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.bucket,
      })
    )
    const contentKeys = response.Contents?.map((content) => content.Key).filter(Boolean) ?? []
    return contentKeys as Array<string>
  }

  /**
   * Get MD5 hash from file
   * @param file - File to get MD5 hash from
   * @returns MD5 hash
   */
  private getMD5HashFromFile(file: Buffer): string {
    return crypto.createHash('md5').update(file).digest('base64')
  }
}
