import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../configs/env.js";

/**
 * Uploads a JSON file to an S3 bucket.
 * @param data - The data to be uploaded.
 */
export async function uploadJSONToS3Bucket(data: unknown) {
  const s3 = new S3Client({});
  await s3.send(
    new PutObjectCommand({
      Bucket: env.DTD_CATALOG_STORAGE_BUCKET,
      Key: `${env.DTD_CATALOG_STORAGE_PATH}/${env.FILENAME}`,
      Body: JSON.stringify(data),
    })
  );
}
