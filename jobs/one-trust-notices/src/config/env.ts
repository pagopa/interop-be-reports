import { z } from 'zod'
import dotenv from 'dotenv'

const envSchema = z.object({
  LANGS: z.string().transform((value) => value.split(',')),

  CONTENT_STORAGE_BUCKET: z.string(),
  HISTORY_STORAGE_BUCKET: z.string(),

  ONETRUST_CLIENT_ID: z.string(),
  ONETRUST_CLIENT_SECRET: z.string(),

  PRIVACY_NOTICES_UPDATER_TERMS_OF_SERVICE_UUID: z.string(),
  PRIVACY_NOTICES_UPDATER_PRIVACY_POLICY_UUID: z.string(),
  PRIVACY_NOTICES_DYNAMO_TABLE_NAME: z.string(),
})

type Env = z.infer<typeof envSchema>

dotenv.config()
export const env: Env = envSchema.parse(process.env)
