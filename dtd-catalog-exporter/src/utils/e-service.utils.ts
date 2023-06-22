import { EServices } from "../models/index.js";

/**
 * Returns all attributes ids inside an array of eservices
 * @param eservices - The array of eservices
 * @returns The array of attributes ids
 */
export function getAllAttributesIdsInEServices(eservices: EServices) {
  const attributesIds: Set<string> = new Set();
  eservices.forEach((eservice) => {
    const { certified, verified, declared } = eservice.attributes;
    [...certified, ...verified, ...declared].forEach((attribute) => {
      if ("ids" in attribute) {
        attribute.ids.forEach(({ id }) => attributesIds.add(id));
      }
      if ("id" in attribute) {
        attributesIds.add(attribute.id.id);
      }
    });
  });
  return Array.from(attributesIds);
}

/**
 * Returns all tenants ids inside an array of eservices
 * @param eservices - The array of eservices
 * @returns The array of tenants ids
 */
export function getAllTenantsIdsInEServices(eservices: EServices) {
  return Array.from(new Set(eservices.map((eservice) => eservice.producerId)));
}
