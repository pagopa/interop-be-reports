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
  certified: z.array(
    z.union([
      publicEServiceAttributeSingleSchema,
      publicEServiceAttributesGroupSchema,
    ])
  ),
  verified: z.array(
    z.union([
      publicEServiceAttributeSingleSchema,
      publicEServiceAttributesGroupSchema,
    ])
  ),
  declared: z.array(
    z.union([
      publicEServiceAttributeSingleSchema,
      publicEServiceAttributesGroupSchema,
    ])
  ),
});

const publicEServiceDocSchema = z.object({
  filename: z.string(),
  prettyName: z.string(),
});

const publicEServiceActiveDescriptorSchema = z.object({
  id: z.string(),
  state: z.enum(["PUBLISHED", "SUSPENDED"]),
  version: z.string(),
});

export const publicEServiceSchema = z.object({
  activeDescriptor: publicEServiceActiveDescriptorSchema,
  technology: z.enum(["REST", "SOAP"]),
  producerName: z.string(),
  id: z.string(),
  name: z.string(),
  description: z.string(),
  attributes: publicEServiceAttributesSchema,
});

export type PublicEService = z.infer<typeof publicEServiceSchema>;
export type PublicEServiceDoc = z.infer<typeof publicEServiceDocSchema>;
export type PublicEServiceActiveDescriptor = z.infer<
  typeof publicEServiceActiveDescriptorSchema
>;
export type PublicEServiceAttribute = z.infer<
  typeof publicEServiceAttributeSchema
>;
export type PublicEServiceAttributes = z.infer<
  typeof publicEServiceAttributesSchema
>;

export const publicEServicesSchema = z.array(publicEServiceSchema);
export type PublicEServices = z.infer<typeof publicEServicesSchema>;
