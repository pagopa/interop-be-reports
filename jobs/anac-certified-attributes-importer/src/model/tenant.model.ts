// TODO This could be moved in commons
import { z } from "zod";

export const PersistentTenantRevoker = z.object({
  id: z.string().uuid(),
  verificationDate: z.date(),
  revocationDate: z.date(),
  expirationDate: z.date().optional(),
  extensionDate: z.date().optional(),
})
export type PersistentTenantRevoker = z.infer<typeof PersistentTenantRevoker>

export const PersistentTenantVerifier = z.object({
  id: z.string().uuid(),
  verificationDate: z.date(),
  expirationDate: z.date().optional(),
  extensionDate: z.date().optional(),
})
export type PersistentTenantVerifier = z.infer<typeof PersistentTenantVerifier>

export const PersistentCertifiedAttribute = z.object({
  id: z.string().uuid(),
  assignmentTimestamp: z.date(),
  revocationTimestamp: z.date().optional(),
})
export type PersistentCertifiedAttribute = z.infer<typeof PersistentCertifiedAttribute>

export const PersistentDeclaredAttribute = z.object({
  id: z.string().uuid(),
  assignmentTimestamp: z.date(),
  revocationTimestamp: z.date().optional(),
})
export type PersistentDeclaredAttribute = z.infer<typeof PersistentDeclaredAttribute>

export const PersistentVerifiedAttribute = z.object({
  id: z.string().uuid(),
  assignmentTimestamp: z.date(),
  verifiedBy: z.array(PersistentTenantVerifier),
  revokedBy: z.array(PersistentTenantRevoker),
})
export type PersistentVerifiedAttribute = z.infer<typeof PersistentVerifiedAttribute>

export const PersistentTenantAttribute = z.object({
})
export type PersistentTenantAttribute = z.infer<typeof PersistentTenantAttribute>

export const PersistentTenat = z.object({
  id: z.string(),
  attributes: z.array(PersistentTenantAttribute),
});
export type PersistentTenat = z.infer<typeof PersistentTenat>
