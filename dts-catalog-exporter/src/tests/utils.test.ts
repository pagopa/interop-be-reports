import {
  getAllTenantsIdsInEServices,
  getAllAttributesIdsInEServices,
  getMappedRecords,
  safelyGetDataFromMap,
} from "../utils.js";
import { getEServiceMock } from "./data.mocks.js";

describe("getAttributesIdsInEServices util", () => {
  it("should return an array of attributes ids", () => {
    const result = getAllAttributesIdsInEServices([getEServiceMock()]);
    expect(result).toEqual([
      "929188a4-bbc8-4509-8999-b2d424de3870",
      "f9d7acb2-dc06-4ff2-be76-498179e7f2e9",
      "c9b5542e-3890-4e04-85ae-27101a9e13f1",
      "db7e7161-1fff-478a-9a1f-c095e195c732",
      "40a01d40-acd0-4fde-8f8f-41f9fec593e1",
      "77055d15-0bed-4ca4-a96c-0ecda4ca8613",
      "036307c0-b621-4d08-99b1-c850acfce6fe",
      "b77f0735-e024-4563-81a0-ec356b71bf1d",
      "922dfb09-f979-42d5-b801-eb8fecedccef",
    ]);
  });

  it("should return an empty array if no eServices are provided", () => {
    const result = getAllAttributesIdsInEServices([]);
    expect(result).toEqual([]);
  });

  it("should remove duplicates", () => {
    const result = getAllAttributesIdsInEServices([
      getEServiceMock(),
      getEServiceMock(),
      getEServiceMock(),
    ]);
    expect(result).toEqual([
      "929188a4-bbc8-4509-8999-b2d424de3870",
      "f9d7acb2-dc06-4ff2-be76-498179e7f2e9",
      "c9b5542e-3890-4e04-85ae-27101a9e13f1",
      "db7e7161-1fff-478a-9a1f-c095e195c732",
      "40a01d40-acd0-4fde-8f8f-41f9fec593e1",
      "77055d15-0bed-4ca4-a96c-0ecda4ca8613",
      "036307c0-b621-4d08-99b1-c850acfce6fe",
      "b77f0735-e024-4563-81a0-ec356b71bf1d",
      "922dfb09-f979-42d5-b801-eb8fecedccef",
    ]);
  });
});

describe("getAllTenantsIdsInEServices util", () => {
  it("should return an array of tenants ids", () => {
    const result = getAllTenantsIdsInEServices([
      getEServiceMock({ producerId: "producerId-1" }),
      getEServiceMock({ producerId: "producerId-2" }),
    ]);
    expect(result).toEqual(["producerId-1", "producerId-2"]);
  });

  it("should return an empty array if no eServices are provided", () => {
    const result = getAllTenantsIdsInEServices([]);
    expect(result).toEqual([]);
  });

  it("should remove duplicates", () => {
    const result = getAllTenantsIdsInEServices([
      getEServiceMock({ producerId: "producerId-1" }),
      getEServiceMock({ producerId: "producerId-2" }),
      getEServiceMock({ producerId: "producerId-1" }),
      getEServiceMock({ producerId: "producerId-2" }),
    ]);
    expect(result).toEqual(["producerId-1", "producerId-2"]);
  });
});

describe("getMappedRecords util", () => {
  it("should return a map of records", () => {
    const records = [
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ];
    const result = getMappedRecords(records);
    expect(result.get("1")).toEqual({ id: "1", name: "John" });
    expect(result.get("2")).toEqual({ id: "2", name: "Jane" });
  });

  it("should return an empty map if no records are provided", () => {
    const result = getMappedRecords([]);
    expect(result).toEqual(new Map());
  });
});

describe("safelyGetDataFromMap util", () => {
  it("should return the record if it exists", () => {
    const records = [
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ];
    const recordsMap = getMappedRecords(records);
    const result = safelyGetDataFromMap("1", recordsMap);
    expect(result).toEqual({ id: "1", name: "John" });
  });

  it("should throw an error if the record does not exist", () => {
    const records = [
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ];
    const recordsMap = getMappedRecords(records);
    expect(() => safelyGetDataFromMap("3", recordsMap)).toThrowError(
      "No data found for 3"
    );
  });
});
