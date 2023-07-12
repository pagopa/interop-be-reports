import {
  GetNoticeContentResponseData,
  OneTrustNoticeVersion,
  OneTrustPublicNotice,
  OneTrustNoticeDBSchema,
} from '../models/index.js'

/**
 * Get the notice html content from the OneTrust notice data.
 * @param oneTrustResponseBody The OneTrust notice data.
 * @returns The notice content.
 * */
export function getNoticeContent(oneTrustResponseBody: GetNoticeContentResponseData) {
  return Object.values(oneTrustResponseBody.notices)[0]
}

/**
 * Get the path in which the notice data will be stored in the buckets.
 * @param lang The language of the notice.
 * @param oneTrustResponseBody The OneTrust notice data.
 */
export function getBucketPath(lang: string, oneTrustPublicNotice: OneTrustPublicNotice): string {
  return `consent/${oneTrustPublicNotice.id}/${oneTrustPublicNotice.versionId}/${lang}/notice.json`
}

/**
 * Remaps the OneTrust notice version retrived from the OneTrust API to the DynamoDB schema object used
 * to update the notice in the database.
 * @param oneTrustNoticeVersion The OneTrust notice version.
 * @returns The DynamoDB schema update object.
 * */
export function remapOneTrustNoticeVersionToDynamoDBSchemaUpdateObject(
  oneTrustNoticeVersion: OneTrustNoticeVersion
): Omit<OneTrustNoticeDBSchema, 'privacyNoticeId'> {
  const {
    id: _privacyNoticeId,
    createdDate,
    lastPublishedDate,
    version: { id: versionId, publishedDate, ...versionRest },
    organizationId,
  } = oneTrustNoticeVersion

  return {
    persistedAt: new Date().toISOString(),
    createdDate: new Date(createdDate).toISOString(),
    lastPublishedDate: new Date(lastPublishedDate).toISOString(),
    privacyNoticeVersion: {
      versionId,
      publishedDate: new Date(publishedDate).toISOString(),
      ...versionRest,
    },
    organizationId,
  }
}
