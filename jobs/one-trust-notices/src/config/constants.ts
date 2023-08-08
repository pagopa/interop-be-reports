import { env } from './env'

export const ONE_STRUST_API_ENDPOINT = 'https://app-de.onetrust.com/api'
export const ONE_TRUST_NOTICES = [
  {
    name: 'Terms of service',
    type: 'tos',
    id: env.PRIVACY_NOTICES_UPDATER_TERMS_OF_SERVICE_UUID,
  },
  {
    name: 'Privacy policy',
    type: 'pp',
    id: env.PRIVACY_NOTICES_UPDATER_PRIVACY_POLICY_UUID,
  },
] as const
