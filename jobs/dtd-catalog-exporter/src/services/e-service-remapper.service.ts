import { getEServiceActiveDescriptor, safelyGetDataFromMap } from "../utils/index.js";
import {
  Attribute,
  EService,
  PublicEService,
  DescriptorAttributes,
  PublicEServiceAttributes,
} from "../models/index.js";
import { Tenant } from "../models/tenants.models.js";

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
  const activeDescriptor = getEServiceActiveDescriptor(eservice);

  return {
    id: eservice.id,
    name: eservice.name,
    description: eservice.description,
    technology: eservice.technology.toUpperCase() as "REST" | "SOAP",
    producerName: safelyGetDataFromMap(eservice.producerId, producersMap).name,
    attributes: remapDescriptorAttributesToPublicAttributes(activeDescriptor.attributes, attributesMap),
    activeDescriptor: {
      id: activeDescriptor.id,
      state: activeDescriptor.state.toUpperCase() as "PUBLISHED" | "SUSPENDED",
      version: activeDescriptor.version,
    },
  };
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
  attributesMap: Map<string, Attribute>
): PublicEServiceAttributes {
  const { certified, verified, declared } = attributes;

  function remapDescriptorAttributesToPublicAttributes(attribute: DescriptorAttributes["certified"][0]) {
    function remapEserviceAttributeToPublicEServiceAttribute(id: string) {
      const attributeData = safelyGetDataFromMap(id, attributesMap);
      return {
        description: attributeData.description,
        name: attributeData.name,
      };
    }

    if ("id" in attribute) {
      return {
        single: remapEserviceAttributeToPublicEServiceAttribute(attribute.id.id),
      };
    }

    return {
      group: attribute.ids.map(({ id }) => remapEserviceAttributeToPublicEServiceAttribute(id)),
    };
  }

  return {
    certified: certified.map(remapDescriptorAttributesToPublicAttributes),
    verified: verified.map(remapDescriptorAttributesToPublicAttributes),
    declared: declared.map(remapDescriptorAttributesToPublicAttributes),
  };
}
