import { z } from "zod";

export const ExternalId = z.object({
  origin: z.string().trim().min(1),
  value: z.string().trim().min(1),
});

export type ExternalId = z.infer<typeof ExternalId>

export const SubUnitType = z.enum(["AOO", "UO"]);

export const SelfcareTenantSeed = z.object({
  externalId: ExternalId,
  selfcareId: z.string().trim().min(1),
  name: z.string().trim().min(1),
  onbordedAt: z.string().trim(),
  digitalAddress: z.string().trim().min(1),
  subUnitType: SubUnitType.optional().nullable(),
});

export type SelfcareTenantSeed = z.infer<typeof SelfcareTenantSeed>

export const SelfcareUpsertTenantResponse = z.object({
  id: z.string().trim().min(1),
});

export type SelfcareUpsertTenantResponse = z.infer<typeof SelfcareUpsertTenantResponse>
