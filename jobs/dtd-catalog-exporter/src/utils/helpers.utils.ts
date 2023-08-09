import { SafeMap } from '@interop-be-reports/commons'

/**
 * Transforms an array of identifiable records into a `SafeMap`.
 * A `SafeMap` is an extended Map that throws an error if the key is not found.
 * Identifiable records are records that have an `id` property.
 *
 * @param records - The array of records
 * @returns The map of records
 * @example
 * const records = [{ id: "1", name: "John" }, { id: "2", name: "Jane" }];
 * const recordsMap = getMappedRecords(records);
 * console.log(recordsMap.get("1")); // { id: "1", name: "John" }
 * console.log(recordsMap.get("2")); // { id: "2", name: "Jane" }
 * console.log(recordsMap.get("3")); // throws an error
 */
export function getSafeMapFromIdentifiableRecords<T extends { id: string }>(
  records: Array<T>
): SafeMap<string, T> {
  return new SafeMap(records.map((record) => [record.id, record]))
}
