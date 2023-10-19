import { Attribute, DescriptorAttributes, EServiceDescriptor, SafeMap } from '@interop-be-reports/commons'
import {
  EServiceQueryOutput,
  EServiceResultAttribute,
  EServiceResultAttributes,
} from '../models/eservice-result.model.js'

/**
 * Maps an array of e-service attributes to an array of public e-service attributes
 * @param attributes - The array of e-service attributes
 * @param attributesMap - The map of attributes
 * @returns The array of public e-service attributes
 *
 **/
export function remapDescriptorAttributesToEServiceResultAttributes(
  attributes: DescriptorAttributes | undefined,
  attributesMap: SafeMap<string, Attribute>
): EServiceResultAttributes {
  function remapDescriptorAttributesToEServiceResultAttribute(
    attributesGroup: DescriptorAttributes['certified'][0]
  ): EServiceResultAttributes['certified'][number] {
    function remapEserviceAttributeToPublicEServiceAttribute(id: string): EServiceResultAttribute {
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

  return {
    certified: attributes?.certified.map(remapDescriptorAttributesToEServiceResultAttribute) ?? [],
    verified: attributes?.verified.map(remapDescriptorAttributesToEServiceResultAttribute) ?? [],
    declared: attributes?.declared.map(remapDescriptorAttributesToEServiceResultAttribute) ?? [],
  }
}

/**
 * Gets the active descriptor from each eservice and returns all attributes ids inside them
 * @param eservices - The array of eservices
 * @returns The array of attributes ids
 */
export function getAllAttributesIdsInEServicesActiveDescriptors(eservices: Array<EServiceQueryOutput>): Array<string> {
  const attributesIds: Set<string> = new Set()

  eservices.forEach(({ attributes }) => {
    if (!attributes) return
    ;[...attributes.certified, ...attributes.verified, ...attributes.declared].forEach((attributesGroup) => {
      attributesGroup.forEach(({ id }) => attributesIds.add(id))
    })
  })

  return Array.from(attributesIds)
}

export function getEServiceActiveDescriptor(eservice: EServiceQueryOutput): EServiceDescriptor {
  let activeDescriptor: EServiceDescriptor | undefined

  // Filter out all descriptors that are not published or suspended
  const descriptors = eservice.descriptors.filter(({ state }) => state === 'Suspended' || state === 'Published')

  // If there are more than one descriptor, get the one with the higher version
  if (descriptors.length > 1) {
    activeDescriptor = descriptors.sort((a, b) => Number(b.version) - Number(a.version))[0]
  } else activeDescriptor = descriptors[0]

  if (!activeDescriptor) {
    throw new Error(`EService ${eservice.name} - ${eservice.id} has no active descriptor`)
  }

  return activeDescriptor
}
