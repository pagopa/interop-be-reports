import { z } from "zod";

const InstitutionState = z.enum(["ACTIVE", "CLOSED"]);
type InstitutionState = z.infer<typeof InstitutionState>;

const SubUnitType = z.enum(["AOO", "UO"]);
type SubUnitType = z.infer<typeof SubUnitType>;

const InstitutionEvent = z.object({
  description: z.string(),
  // digitalAddress: z.string(),
  origin: z.string(),
  originId: z.string(),
  taxCode: z.string(),
  subUnitCode: z.string().optional().nullable(), // AOO/UO ID
  subUnitType: SubUnitType.optional().nullable(),
});
export type InstitutionEvent = z.infer<typeof InstitutionEvent>

export const EventPayload = z.object({
  id: z.string(),
  internalIstitutionID: z.string(), // Selfcare ID
  product: z.string(),
  state: InstitutionState,
  onboardingTokenId: z.string(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  closedAt: z.string().datetime({ offset: true }).optional().nullable(),
  institution: InstitutionEvent,
  notificationType: z.string().optional().nullable() // Undocumented TODO Check
});
export type EventPayload = z.infer<typeof EventPayload>
