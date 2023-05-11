import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../env.js";

/**
 * Uploads a JSON file to an S3 bucket.
 * @param data - The data to be uploaded.
 */
export async function uploadJSONToS3Bucket(data: unknown) {
  const s3 = new S3Client({ region: env.AWS_REGION });
  await s3.send(
    new PutObjectCommand({
      Bucket: env.STORAGE_BUCKET,
      Key: env.FILENAME,
      Body: JSON.stringify(data),
    })
  );
}
