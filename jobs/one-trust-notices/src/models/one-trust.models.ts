import { z } from 'zod'

export const oneTrustNoticeVersion = z.object({
  id: z.string().uuid(),
  createdDate: z.string(),
  lastPublishedDate: z.string(),
  organizationId: z.string().uuid(),
  version: z.object({
    id: z.string().uuid(),
    name: z.string(),
    publishedDate: z.string(),
    status: z.string(),
    version: z.number(),
  }),
})

export type OneTrustNoticeVersion = z.infer<typeof oneTrustNoticeVersion>

export const oneTrustPublicNoticeSchema = z.object({
  content: z.string(),
  timestamp: z.string(),
  contentCss: z.array(z.string()),
  id: z.string(),
  versionId: z.string(),
  tenantId: z.string(),
  targetElementValue: z.string(),
  targetElementAttribute: z.string(),
})

export type OneTrustPublicNotice = z.infer<typeof oneTrustPublicNoticeSchema>

export const getNoticeContentResponseDataSchema = z.object({
  schemaType: z.string(),
  schemaVersion: z.number(),
  notices: z.record(z.string(), oneTrustPublicNoticeSchema),
})

export type GetNoticeContentResponseData = z.infer<typeof getNoticeContentResponseDataSchema>
