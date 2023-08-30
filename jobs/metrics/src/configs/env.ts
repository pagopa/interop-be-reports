import dotenv from 'dotenv'
import { z } from 'zod'

export const envSchema = z.object({
  TENANTS_COLLECTION_NAME: z.string(),
  PURPOSES_COLLECTION_NAME: z.string(),
  ESERVICES_COLLECTION_NAME: z.string(),
  ATTRIBUTES_COLLECTION_NAME: z.string(),
  AGREEMENTS_COLLECTION_NAME: z.string(),

  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  MONGODB_REPLICA_SET: z.string().optional(),
  MONGODB_READ_PREFERENCE: z.string(),
  MONGODB_DIRECT_CONNECTION: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  MONGODB_RETRY_WRITES: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
})

export type Env = z.infer<typeof envSchema>

dotenv.config()

if (process.env.NODE_ENV !== 'test') {
  envSchema.parse(process.env)
}

export const env = process.env as unknown as Env