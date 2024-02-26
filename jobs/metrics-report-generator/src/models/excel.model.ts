import { DescriptorState } from '@interop-be-reports/commons'
import { z } from 'zod'

export const AgreementsWorksheetTableData = z.object({
  EserviceId: z.string(),
  Eservice: z.string(),
  Producer: z.string(),
  ProducerId: z.string(),
  Consumer: z.string(),
  ConsumerId: z.string(),
  Agreement: z.string(),
  Purposes: z.string(),
  PurposeIds: z.string(),
})
export type AgreementsWorksheetTableData = z.infer<typeof AgreementsWorksheetTableData>

export const DescriptorsWorksheetTableData = z.object({
  Name: z.string(),
  CreatedAt: z.string(),
  ProducerId: z.string(),
  Producer: z.string(),
  DescriptorId: z.string(),
  State: DescriptorState,
  Fingerprint: z.string(),
})
export type DescriptorsWorksheetTableData = z.infer<typeof DescriptorsWorksheetTableData>

export const TokensWorksheetTableData = z.object({
  agreementId: z.string(),
  purposeId: z.string(),
  date: z.string(),
  tokencount: z.string(),
  agreementState: z.string(),
  tokenDuration: z.string(),
})
export type TokensWorksheetTableData = z.infer<typeof TokensWorksheetTableData>
