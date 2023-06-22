import { safelyGetDataFromMap } from '../utils/index.js'
import {
  Attribute,
  EService,
  EServiceAttributes,
  PublicEService,
  PublicEServiceActiveDescriptor,
  PublicEServiceAttributes,
} from '../models/index.js'
import { Tenant } from '../models/tenants.models.js'

/**
 * Remaps an e-service to a public e-service
 * @param eservice - The e-service
 * @param attributesMap - The map of attributes data
 * @param producersMap - The map of producers data
 * @returns The public e-service
 */
export function remapEServiceToPublicEService(
  eservice: EService,
  attributesMap: Map<string, Attribute>,
  producersMap: Map<string, Tenant>
): PublicEService {
  return {
    id: eservice.id,
    name: eservice.name,
    description: eservice.description,
    technology: eservice.technology.toUpperCase() as 'REST' | 'SOAP',
    producerName: safelyGetDataFromMap(eservice.producerId, producersMap).name,
    attributes: remapEServiceAttributesToPublicEServiceAttributes(
      eservice.attributes,
      attributesMap
    ),
    activeDescriptor: getActiveDescriptor(eservice),
  }
}

/**
 * Maps an array of e-service attributes to an array of public e-service attributes
 * @param attributes - The array of e-service attributes
 * @param attributesMap - The map of attributes
 * @returns The array of public e-service attributes
 *
 **/
function remapEServiceAttributesToPublicEServiceAttributes(
  attributes: EServiceAttributes,
  attributesMap: Map<string, Attribute>
): PublicEServiceAttributes {
  const { certified, verified, declared } = attributes

  function remapEserviceAttributesToPublicEServiceAttributes(
    attribute: EServiceAttributes['certified'][0]
  ) {
    function remapEserviceAttributeToPublicEServiceAttribute(id: string) {
      const attributeData = safelyGetDataFromMap(id, attributesMap)
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
    certified: certified.map(remapEserviceAttributesToPublicEServiceAttributes),
    verified: verified.map(remapEserviceAttributesToPublicEServiceAttributes),
    declared: declared.map(remapEserviceAttributesToPublicEServiceAttributes),
  }
}

/**
 * Gets the active descriptor of an e-service.
 * To get the active descriptor, we look for the first descriptor with state "Published" or "Suspended".
 * If no descriptor is found, an error is thrown.
 * @param eservice - The e-service
 * @returns The active descriptor
 */
function getActiveDescriptor(eservice: EService): PublicEServiceActiveDescriptor {
  const activeDescriptor = eservice.descriptors.find(
    ({ state }) => state === 'Published' || state === 'Suspended'
  )

  if (!activeDescriptor) {
    throw new Error(`No active descriptor found for e-service ${eservice.id}`)
  }

  return {
    id: activeDescriptor.id,
    state: activeDescriptor.state.toUpperCase() as 'PUBLISHED' | 'SUSPENDED',
    version: activeDescriptor.version,
  }
}
