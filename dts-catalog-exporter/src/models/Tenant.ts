import { z } from "zod";

export const tenantSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Tenant = z.infer<typeof tenantSchema>;

export const tenantsSchema = z.array(tenantSchema);
export type Tenants = z.infer<typeof tenantsSchema>;
