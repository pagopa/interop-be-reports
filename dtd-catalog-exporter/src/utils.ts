import { EServices } from "./models/EService.js";

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

/**
 * Transforms an array of identifiable records into a map of records
 * @param records - The array of records
 * @returns The map of records
 * @example
 * const records = [{ id: "1", name: "John" }, { id: "2", name: "Jane" }];
 * const recordsMap = getMappedRecords(records);
 * console.log(recordsMap.get("1")); // { id: "1", name: "John" }
 * console.log(recordsMap.get("2")); // { id: "2", name: "Jane" }
 */
export function getMappedRecords<TRecord extends { id: string }>(
  records: Array<TRecord>
) {
  const result = new Map<string, TRecord>();
  records.forEach((record) => {
    result.set(record.id, record);
  });
  return result;
}

/**
 * Checks if a record exists in a map and returns it
 * @throws Error if the record does not exist
 * @param id - The id of the record
 * @param map - The map to check
 * @returns The record
 */
export function safelyGetDataFromMap<TData>(
  id: string,
  map: Map<string, TData>
) {
  const data = map.get(id);
  if (!data) {
    throw new Error(`No data found for ${id}`);
  }
  return data;
}

/**
 * Returns the execution time in seconds and milliseconds
 * @param startTime - The start time of the execution
 * @returns The execution time in seconds and milliseconds
 **/
export function getExecutionTime(startTime: [number, number]) {
  const endTime = process.hrtime(startTime);
  return `${endTime[0]}s ${Math.round(endTime[1] / 1000000)}ms`;
}
