import { z } from 'zod'
import dotenv from 'dotenv'

const envSchema = z.object({

  SELFCARE_BROKER_URLS: z.string().transform((value) => value.split(',')),
  BROKER_CONNECTION_STRING: z.string(),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string(),
  TOPIC_NAME: z.string(),

  INTEROP_PRODUCT: z.string(),
})

export type Env = z.infer<typeof envSchema>

dotenv.config()
export const env: Env = envSchema.parse(process.env)
