import dotenv from 'dotenv'
import { z } from 'zod'

export const envSchema = z.object({
  TENANTS_COLLECTION_NAME: z.string(),
  PURPOSES_COLLECTION_NAME: z.string(),

  READ_MODEL_DB_USER: z.string(),
  READ_MODEL_DB_PASSWORD: z.string(),
  READ_MODEL_DB_HOST: z.string(),
  READ_MODEL_DB_PORT: z.string(),
  READ_MODEL_DB_NAME: z.string(),

  SMTP_ADDRESS: z.string(),
  SMTP_PORT: z.string().transform((value) => Number(value)),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),
  SMTP_SECURE: z.string().transform((value) => value === 'true'),
  MAIL_RECIPIENTS: z.string().transform((value) => value.split(',')),

  PN_ESERVICE_ID: z.string(),
  COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID: z.string(),

  MONGODB_REPLICA_SET: z.string(),
  MONGODB_READ_PREFERENCE: z.string(),
  MONGODB_DIRECT_CONNECTION: z.string().transform((value) => value === 'true'),
  MONGODB_RETRY_WRITES: z.string().transform((value) => value === 'true'),
})

export type Env = z.infer<typeof envSchema>

dotenv.config()

export const env: Env = envSchema.parse(process.env)
