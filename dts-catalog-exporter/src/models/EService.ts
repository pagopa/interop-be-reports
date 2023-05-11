import { z } from "zod";

const eserviceAttributeSchema = z.object({
  explicitAttributeVerification: z.boolean(),
  id: z.string(),
});

const eserviceAttributeSingleSchema = z.object({
  id: eserviceAttributeSchema,
});

const eserviceAttributesGroupSchema = z.object({
  ids: z.array(eserviceAttributeSchema),
});

const eserviceAttributesSchema = z.object({
  certified: z.array(
    z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])
  ),
  verified: z.array(
    z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])
  ),
  declared: z.array(
    z.union([eserviceAttributeSingleSchema, eserviceAttributesGroupSchema])
  ),
});

const eserviceDocSchema = z.object({
  checksum: z.string(),
  contentType: z.string(),
  id: z.string(),
  name: z.string(),
  path: z.string(),
  prettyName: z.string(),
  uploadDate: z.string(),
});

const descriptorSchema = z.object({
  activatedAt: z.string().optional(),
  agreementApprovalPolicy: z.enum(["Manual", "Automatic"]),
  audience: z.array(z.string()),
  createdAt: z.string(),
  dailyCallsPerConsumer: z.number(),
  dailyCallsTotal: z.number(),
  description: z.string(),
  docs: z.array(eserviceDocSchema),
  id: z.string(),
  interface: eserviceDocSchema.optional(),
  serverUrls: z.array(z.string()),
  state: z.enum(["Published", "Draft", "Deprecated", "Suspended"]),
  version: z.string(),
  voucherLifespan: z.number(),
});

export const eserviceSchema = z.object({
  attributes: eserviceAttributesSchema,
  createdAt: z.string(),
  description: z.string(),
  descriptors: z.array(descriptorSchema),
  id: z.string(),
  name: z.string(),
  producerId: z.string(),
  technology: z.enum(["Rest", "Soap"]),
});

export type EService = z.infer<typeof eserviceSchema>;
export type EServiceDoc = z.infer<typeof eserviceDocSchema>;
export type EServiceAttribute = z.infer<typeof eserviceAttributeSchema>;
export type EServiceAttributes = z.infer<typeof eserviceAttributesSchema>;

export const eservicesSchema = z.array(eserviceSchema);
export type EServices = z.infer<typeof eservicesSchema>;
