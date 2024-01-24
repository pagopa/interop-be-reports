import { z } from 'zod'

export const AgreementState = z.enum([
  'Active',
  'Draft',
  'Pending',
  'Suspended',
  'Archived',
  'Rejected',
  'MissingCertifiedAttributes',
])

export const AgreementDocument = z.object({
  id: z.string().uuid(),
  name: z.string(),
  prettyName: z.string(),
  contentType: z.string(),
  path: z.string(),
  createdAt: z.string().pipe(z.coerce.date()),
})

export const Stamp = z.object({
  when: z.string().pipe(z.coerce.date()),
  who: z.string().uuid(),
})

export const Stamps = z.object({
  submission: Stamp.optional(),
  activation: Stamp.optional(),
  rejection: Stamp.optional(),
  suspensionByProducer: Stamp.optional(),
  suspensionByConsumer: Stamp.optional(),
  upgrade: Stamp.optional(),
  archiving: Stamp.optional(),
})

export const Agreement = z.object({
  id: z.string().uuid(),
  eserviceId: z.string().uuid(),
  descriptorId: z.string().uuid(),
  producerId: z.string().uuid(),
  consumerId: z.string().uuid(),
  state: AgreementState,
  verifiedAttributes: z.array(z.object({ id: z.string().uuid() })),
  certifiedAttributes: z.array(z.object({ id: z.string().uuid() })),
  declaredAttributes: z.array(z.object({ id: z.string().uuid() })),
  suspendedByConsumer: z.boolean().optional(),
  suspendedByProducer: z.boolean().optional(),
  suspendedByPlatform: z.boolean().optional(),
  consumerDocuments: z.array(AgreementDocument),
  createdAt: z.string().pipe(z.coerce.date()),
  updatedAt: z.string().pipe(z.coerce.date()).optional(),
  consumerNotes: z.string().optional(),
  contract: AgreementDocument.optional(),
  stamps: Stamps,
  rejectionReason: z.string().optional(),
  suspendedAt: z.string().pipe(z.coerce.date()).optional(),
})

export type AgreementState = z.infer<typeof AgreementState>
export type AgreementDocument = z.infer<typeof AgreementDocument>
export type Stamp = z.infer<typeof Stamp>
export type Stamps = z.infer<typeof Stamps>
export type Agreement = z.infer<typeof Agreement>

export const Agreements = z.array(Agreement)
export type Agreements = z.infer<typeof Agreements>
