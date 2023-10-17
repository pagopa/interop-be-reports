import { EServiceDescriptor, EService as ReadModelEService } from '@interop-be-reports/commons'
import { z } from 'zod'

export const EService = ReadModelEService.pick({ id: true, name: true }).and(
  EServiceDescriptor.pick({ dailyCallsTotal: true, dailyCallsPerConsumer: true, voucherLifespan: true })
)

export type EService = z.infer<typeof EService>
