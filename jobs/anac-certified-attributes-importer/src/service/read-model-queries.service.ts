import { ReadModelClient } from "@interop-be-reports/commons";
import { PersistentTenant } from "../model/tenant.model.js";

const projectUnrevokedCertifiedAttributes = {
  _id: 0,
  'data.id': 1,
  'data.attributes': {
    '$filter': {
      input: '$data.attributes',
      as: 'attribute',
      cond: { $and: [{ $eq: ['$$attribute.type', 'PersistentCertifiedAttribute'] }, { $ne: ['$$attribute.revocationTimestamp', null] }] }
    }
  }
}

/**
 * Retrieve all PA tenants that matches the given IPA codes, with their unrevoked certified attribute
 */
export async function getPATenants(readModelClient: ReadModelClient, collectionName: string, ipaCodes: string[]): Promise<PersistentTenant[]> {
  return await readModelClient.db()
    .collection<{ data: PersistentTenant }>(collectionName)
    .aggregate([
      {
        $match: {
          'data.externalId.origin': "IPA",
          'data.externalId.value': { $in: ipaCodes },
        }
      },
      {
        $project: projectUnrevokedCertifiedAttributes
      }
    ])
    .map(({ data }) => PersistentTenant.parse(data))
    .toArray()
}

/**
 * Retrieve all non-PA tenants that matches the given tax codes, with their unrevoked certified attribute
 */
export async function getNonPATenants(readModelClient: ReadModelClient, collectionName: string, taxCodes: string[]): Promise<PersistentTenant[]> {
  return await readModelClient.db()
    .collection<{ data: PersistentTenant }>(collectionName)
    .find(
      {
        'data.externalId.origin': { $ne: "IPA" },
        'data.externalId.value': { $in: taxCodes },
      },
      {
        projection: projectUnrevokedCertifiedAttributes
      }
    )
    .map(({ data }) => PersistentTenant.parse(data))
    .toArray()
}
