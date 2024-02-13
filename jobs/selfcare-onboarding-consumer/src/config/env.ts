import { z } from 'zod'
import dotenv from 'dotenv'

const Env = z.object({
  SELFCARE_BROKER_URLS: z.string().transform((value) => value.split(',')),
  BROKER_CONNECTION_STRING: z.string(),
  KAFKA_CLIENT_ID: z.string(),
  KAFKA_GROUP_ID: z.string(),
  TOPIC_NAME: z.string(),

  RESET_CONSUMER_OFFSETS: z
    .string()
    .default('false')
    .transform((value) => value.toUpperCase() === 'TRUE'),

  INTEROP_PRODUCT: z.string(),
  ALLOWED_ORIGINS: z.string().transform((value) => value.split(',')),

  TENANT_PROCESS_URL: z.string(),

  INTERNAL_JWT_KID: z.string(),
  INTERNAL_JWT_SUBJECT: z.string(),
  INTERNAL_JWT_ISSUER: z.string(),
  INTERNAL_JWT_AUDIENCE: z.string().transform((value) => value.split(',')),
  INTERNAL_JWT_SECONDS_DURATION: z.string().transform((v, _) => parseInt(v)),
})

export type Env = z.infer<typeof Env>

dotenv.config()
export const env: Env = Env.parse(process.env)
