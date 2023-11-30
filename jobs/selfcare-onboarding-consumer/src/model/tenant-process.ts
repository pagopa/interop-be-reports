import { z } from "zod";

export const ExternalId = z.object({
  origin: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export type ExternalId = z.infer<typeof ExternalId>

export const SubUnitType = z.enum(["AOO", "UO"]);

export type SubUnitType = z.infer<typeof SubUnitType>

export const MailKind = z.enum(["CONTACT_EMAIL", "DIGITAL_ADDRESS"]);

export type MailKind = z.infer<typeof MailKind>

export const MailSeed = z.object({
  kind: MailKind,
  address: z.string().trim().min(1),
  description: z.string().trim().min(1),
});


export const SelfcareTenantSeed = z.object({
  externalId: ExternalId,
  selfcareId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  onboardedAt: z.string().trim(),
  digitalAddress: MailSeed.optional(),
  subUnitType: SubUnitType.optional(),
});

export type SelfcareTenantSeed = z.infer<typeof SelfcareTenantSeed>

export const SelfcareUpsertTenantResponse = z.object({
  id: z.string().trim().min(1),
});

export type SelfcareUpsertTenantResponse = z.infer<typeof SelfcareUpsertTenantResponse>
