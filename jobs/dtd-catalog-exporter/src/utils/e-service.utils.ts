import { PublicEService, PublicEServiceAttributes } from '../models'
import {
  SafeMap,
  EService,
  EServiceDescriptor,
  EServices,
  Attribute,
  DescriptorAttributes,
  Tenant,
} from '@interop-be-reports/commons'

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
  const activeDescriptor = getEServiceActiveDescriptor(eservice)

  return {
    id: eservice.id,
    name: eservice.name,
    description: eservice.description,
    technology: eservice.technology.toUpperCase() as 'REST' | 'SOAP',
    producerName: producersMap.get(eservice.producerId).name,
    attributes: remapDescriptorAttributesToPublicAttributes(
      activeDescriptor.attributes,
      attributesMap
    ),
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
  const { certified, verified, declared } = attributes

  function remapDescriptorAttributesToPublicAttributes(
    attribute: DescriptorAttributes['certified'][0]
  ) {
    function remapEserviceAttributeToPublicEServiceAttribute(id: string) {
      const attributeData = attributesMap.get(id)
      return {
        description: attributeData.description,
        name: attributeData.name,
      }
    }

    if ('id' in attribute) {
      return {
        single: remapEserviceAttributeToPublicEServiceAttribute(attribute.id.id),
      }
    }

    return {
      group: attribute.ids.map(({ id }) => remapEserviceAttributeToPublicEServiceAttribute(id)),
    }
  }

  return {
    certified: certified.map(remapDescriptorAttributesToPublicAttributes),
    verified: verified.map(remapDescriptorAttributesToPublicAttributes),
    declared: declared.map(remapDescriptorAttributesToPublicAttributes),
  }
}

/**
 * Gets the active descriptor of an e-service.
 * To get the active descriptor, we look for the first descriptor with state "Published" or "Suspended".
 * If no descriptor is found, an error is thrown.
 * @param eservice - The e-service
 * @returns The active descriptor
 */
export function getEServiceActiveDescriptor(eservice: EService): EServiceDescriptor {
  const activeDescriptor = eservice.descriptors.find(
    ({ state }) => state === 'Published' || state === 'Suspended'
  )

  if (!activeDescriptor) {
    throw new Error(`No active descriptor found for e-service ${eservice.id}`)
  }

  return activeDescriptor
}

/**
 * Gets the active descriptor from each eservice and returns all attributes ids inside them
 * @param eservices - The array of eservices
 * @returns The array of attributes ids
 */
export function getAllAttributesIdsInEServicesActiveDescriptors(eservices: EServices) {
  const attributesIds: Set<string> = new Set()

  eservices.forEach((eservice) => {
    const activeDescriptor = getEServiceActiveDescriptor(eservice)
    const { certified, verified, declared } = activeDescriptor.attributes
    ;[...certified, ...verified, ...declared].forEach((attribute) => {
      if ('ids' in attribute) {
        attribute.ids.forEach(({ id }) => attributesIds.add(id))
      }
      if ('id' in attribute) {
        attributesIds.add(attribute.id.id)
      }
    })
  })

  return Array.from(attributesIds)
}

/**
 * Returns all tenants ids inside an array of eservices
 * @param eservices - The array of eservices
 * @returns The array of tenants ids
 */
export function getAllTenantsIdsInEServices(eservices: EServices) {
  return Array.from(new Set(eservices.map((eservice) => eservice.producerId)))
}
