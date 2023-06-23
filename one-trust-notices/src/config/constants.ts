import { env } from './env.js'

export const ONE_STRUST_API_ENDPOINT = 'https://app-de.onetrust.com/api'
export const ONE_TRUST_NOTICES = [
  {
    name: 'Terms of service',
    id: env.TERMS_OF_SERVICE_NOTICE_ID,
  },
  {
    name: 'Privacy policy',
    id: env.PRIVACY_POLICY_NOTICE_ID,
  },
] as const
