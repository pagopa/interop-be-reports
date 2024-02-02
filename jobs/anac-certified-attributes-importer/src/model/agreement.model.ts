import { Agreement } from '@interop-be-reports/commons'
import { z } from 'zod'

export const PersistentAgreement = Agreement.pick({ id: true })
export type PersistentAgreement = z.infer<typeof PersistentAgreement>
