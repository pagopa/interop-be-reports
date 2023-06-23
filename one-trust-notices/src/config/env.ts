import { z } from 'zod'
import dotenv from 'dotenv'

const envSchema = z.object({
  LANGS: z.string().transform((value) => value.split(',')),
  PUBLIC_STORAGE_PATH: z.string(),

  CONTENT_STORAGE_BUCKET: z.string(),
  HISTORY_STORAGE_BUCKET: z.string(),

  ONE_TRUST_CLIENT_ID: z.string(),
  ONE_TRUST_CLIENT_SECRET: z.string(),

  TERMS_OF_SERVICE_NOTICE_ID: z.string(),
  PRIVACY_POLICY_NOTICE_ID: z.string(),
  PRIVACY_NOTICES_DYNAMO_TABLE_NAME: z.string(),
})

type Env = z.infer<typeof envSchema>

dotenv.config()
export const env: Env = envSchema.parse(process.env)
