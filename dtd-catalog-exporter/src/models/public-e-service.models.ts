import { z } from "zod";

const publicEServiceAttributeSchema = z.object({
  name: z.string(),
  description: z.string(),
});

const publicEServiceAttributeSingleSchema = z.object({
  single: publicEServiceAttributeSchema,
});

const publicEServiceAttributesGroupSchema = z.object({
  group: z.array(publicEServiceAttributeSchema),
});

const publicEServiceAttributesSchema = z.object({
  certified: z.array(z.union([publicEServiceAttributeSingleSchema, publicEServiceAttributesGroupSchema])),
  verified: z.array(z.union([publicEServiceAttributeSingleSchema, publicEServiceAttributesGroupSchema])),
  declared: z.array(z.union([publicEServiceAttributeSingleSchema, publicEServiceAttributesGroupSchema])),
});

const publicEServiceDocSchema = z.object({
  filename: z.string(),
  prettyName: z.string(),
});

const publicEServiceDescriptorSchema = z.object({
  id: z.string(),
  state: z.enum(["PUBLISHED", "SUSPENDED"]),
  version: z.string(),
});

export const publicEServiceSchema = z.object({
  activeDescriptor: publicEServiceDescriptorSchema,
  technology: z.enum(["REST", "SOAP"]),
  producerName: z.string(),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attributes: publicEServiceAttributesSchema,
});

export type PublicEService = z.infer<typeof publicEServiceSchema>;
export type PublicEServiceDoc = z.infer<typeof publicEServiceDocSchema>;
export type PublicEServiceDescriptor = z.infer<typeof publicEServiceDescriptorSchema>;
export type PublicEServiceAttribute = z.infer<typeof publicEServiceAttributeSchema>;
export type PublicEServiceAttributes = z.infer<typeof publicEServiceAttributesSchema>;

export const publicEServicesSchema = z.array(publicEServiceSchema);
export type PublicEServices = z.infer<typeof publicEServicesSchema>;
