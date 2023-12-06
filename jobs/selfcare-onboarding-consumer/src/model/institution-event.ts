import { z } from "zod";

const SubUnitType = z.enum(["AOO", "UO"]);
type SubUnitType = z.infer<typeof SubUnitType>;

const InstitutionEvent = z.object({
  description: z.string().trim().min(1),
  origin: z.string().trim().min(1),
  originId: z.string().trim().min(1),
  taxCode: z.string().trim().min(1),
  subUnitCode: z.string().optional().nullable(), // AOO/UO ID
  subUnitType: SubUnitType.optional().nullable(),
  digitalAddress: z.string().trim().min(1),
});
export type InstitutionEvent = z.infer<typeof InstitutionEvent>

export const EventPayload = z.object({
  id: z.string(),
  internalIstitutionID: z.string().trim().min(1), // Selfcare ID
  product: z.string().trim().min(1),
  onboardingTokenId: z.string(),
  institution: InstitutionEvent,
  createdAt: z.string(),
});
export type EventPayload = z.infer<typeof EventPayload>
