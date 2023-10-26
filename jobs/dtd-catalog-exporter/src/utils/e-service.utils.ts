import {
  Attribute,
  PublicEService,
  PublicEServiceAttribute,
  PublicEServiceAttributes,
  Tenant,
} from '../models/index.js'
import { SafeMap, EService, EServices, DescriptorAttributes, getActiveDescriptor } from '@interop-be-reports/commons'

/**
 * Remaps an e-service to a public e-service
 * @param eservice - The e-service
 * @param attributesMap - The map of attributes data
 * @param producersMap - The map of producers data
 * @returns The public e-service
 */
export function remapEServiceToPublicEService(
  eservice: EService,
  attributesMap: SafeMap<string, Attribute>,
  producersMap: SafeMap<string, Tenant>
): PublicEService {
  const activeDescriptor = getActiveDescriptor(eservice.descriptors)

  if (!activeDescriptor) {
    throw new Error(`EService ${eservice.name} - ${eservice.id} has no active descriptor`)
  }

  return {
    id: eservice.id,
    name: eservice.name,
    description: eservice.description,
    technology: eservice.technology.toUpperCase() as 'REST' | 'SOAP',
    producerName: producersMap.get(eservice.producerId).name,
    attributes: remapDescriptorAttributesToPublicAttributes(activeDescriptor.attributes, attributesMap),
    activeDescriptor: {
      id: activeDescriptor.id,
      state: activeDescriptor.state.toUpperCase() as 'PUBLISHED' | 'SUSPENDED',
      version: activeDescriptor.version,
    },
  }
}

/**
 * Maps an array of e-service attributes to an array of public e-service attributes
 * @param attributes - The array of e-service attributes
 * @param attributesMap - The map of attributes
 * @returns The array of public e-service attributes
 *
 **/
function remapDescriptorAttributesToPublicAttributes(
  attributes: DescriptorAttributes,
  attributesMap: SafeMap<string, Attribute>
): PublicEServiceAttributes {
  function remapDescriptorAttributesToPublicAttributes(
    attributesGroup: DescriptorAttributes['certified'][0]
  ): PublicEServiceAttributes['certified'][number] {
    function remapEserviceAttributeToPublicEServiceAttribute(id: string): PublicEServiceAttribute {
      const attributeData = attributesMap.get(id)
      return {
        description: attributeData.description,
        name: attributeData.name,
      }
    }

    if (attributesGroup.length === 1) {
      return {
        single: remapEserviceAttributeToPublicEServiceAttribute(attributesGroup[0].id),
      }
    }

    return {
      group: attributesGroup.map(({ id }) => remapEserviceAttributeToPublicEServiceAttribute(id)),
    }
  }

  const { certified, verified, declared } = attributes

  return {
    certified: certified.map(remapDescriptorAttributesToPublicAttributes),
    verified: verified.map(remapDescriptorAttributesToPublicAttributes),
    declared: declared.map(remapDescriptorAttributesToPublicAttributes),
  }
}

/**
 * Gets the active descriptor from each eservice and returns all attributes ids inside them
 * @param eservices - The array of eservices
 * @returns The array of attributes ids
 */
export function getAllAttributesIdsInEServicesActiveDescriptors(eservices: EServices): Array<string> {
  const attributesIds: Set<string> = new Set()

  eservices.forEach((eservice) => {
    const activeDescriptor = getActiveDescriptor(eservice.descriptors)

    if (!activeDescriptor) {
      throw new Error(`EService ${eservice.name} - ${eservice.id} has no active descriptor`)
    }

    const { certified, verified, declared } = activeDescriptor.attributes
    ;[...certified, ...verified, ...declared].forEach((attributesGroup) => {
      attributesGroup.forEach(({ id }) => attributesIds.add(id))
    })
  })

  return Array.from(attributesIds)
}

/**
 * Returns all tenants ids inside an array of eservices
 * @param eservices - The array of eservices
 * @returns The array of tenants ids
 */
export function getAllTenantsIdsInEServices(eservices: EServices): Array<string> {
  return Array.from(new Set(eservices.map((eservice) => eservice.producerId)))
}
