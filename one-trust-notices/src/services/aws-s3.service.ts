import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getMD5HashFromFile } from '../utils/index.js'

export class AwsS3Client {
  private s3Client: S3Client

  constructor() {
    this.s3Client = new S3Client({})
  }

  /**
   * Uploads a JSON file to an S3 bucket.
   * @param bucket The name of the bucket.
   * @param data The data to be uploaded. The data will be stringified if it is not a string.
   * @param path The path in which the data will be stored in the bucket.
   */
  public async uploadJSONToS3Bucket(bucket: string, data: string | unknown, path: string) {
    const stringifiedData = typeof data === 'string' ? data : JSON.stringify(data)
    const fileData = Buffer.from(stringifiedData)

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: stringifiedData,
        ContentMD5: getMD5HashFromFile(fileData),
      })
    )
  }

  /**
   * Get the list of objects in the given bucket.
   * @param bucket The name of the bucket.
   * @returns The list of objects in the given bucket.
   * */
  async getBucketContentList(bucket: string) {
    const response = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
      })
    )
    const contentKeys = response.Contents?.map((content) => content.Key).filter(Boolean) ?? []
    return contentKeys as Array<string>
  }
}
