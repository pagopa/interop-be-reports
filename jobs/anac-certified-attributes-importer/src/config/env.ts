import { z } from 'zod'
import dotenv from 'dotenv'

const envSchema = z.object({

  SFTP_HOST: z.string(),
  SFTP_PORT: z.string().transform((v, _) => parseInt(v)),
  SFTP_USERNAME: z.string(),
  SFTP_PRIVATE_KEY: z.string(),
  SFTP_PATH: z.string(),

  MONGODB_REPLICA_SET: z.string().optional(),
  MONGODB_DIRECT_CONNECTION: z.string().transform(value => value.toUpperCase() === 'TRUE').optional(),
  MONGODB_READ_PREFERENCE: z.string().optional(),
  MONGODB_RETRY_WRITES: z.string().transform(value => value.toUpperCase() === 'TRUE').optional(),
  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  TENANTS_COLLECTION_NAME: z.string(),

  ANAC_TENANT_ID: z.string(),
  // TODO Define these
  ANAC_ATTR_1_CODE: z.string(),
  //

  RECORDS_PROCESS_BATCH_SIZE: z.string().transform((v, _) => parseInt(v)),

  FORCE_REMOTE_FILE_NAME: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

dotenv.config()
export const env: Env = envSchema.parse(process.env)
