import { EService, EServiceDescriptor, EServices } from "../models/index.js";

/**
 * Gets the active descriptor of an e-service.
 * To get the active descriptor, we look for the first descriptor with state "Published" or "Suspended".
 * If no descriptor is found, an error is thrown.
 * @param eservice - The e-service
 * @returns The active descriptor
 */
export function getEServiceActiveDescriptor(eservice: EService): EServiceDescriptor {
  const activeDescriptor = eservice.descriptors.find(({ state }) => state === "Published" || state === "Suspended");

  if (!activeDescriptor) {
    throw new Error(`No active descriptor found for e-service ${eservice.id}`);
  }

  return activeDescriptor;
}

/**
 * Gets the active descriptor from each eservice and returns all attributes ids inside them
 * @param eservices - The array of eservices
 * @returns The array of attributes ids
 */
export function getAllAttributesIdsInEServicesActiveDescriptors(eservices: EServices) {
  const attributesIds: Set<string> = new Set();

  eservices.forEach((eservice) => {
    const activeDescriptor = getEServiceActiveDescriptor(eservice);
    const { certified, verified, declared } = activeDescriptor.attributes;
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
