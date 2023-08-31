import { ReadModelClient } from "@interop-be-reports/commons";
import { PersistentTenant } from "../model/tenant.model.js";
import { PersistentAttribute } from "../model/attribute.model.js";

const projectUnrevokedCertifiedAttributes = {
  _id: 0,
  'data.id': 1,
  'data.externalId': 1,
  'data.features': 1,
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
    .aggregate([
      {
        $match: {
          'data.externalId.origin': { $ne: "IPA" },
          'data.externalId.value': { $in: taxCodes },
        }
      },
      {
        $project: projectUnrevokedCertifiedAttributes
      }
    ])
    .map(({ data }) => PersistentTenant.parse(data))
    .toArray()
}


export async function getTenantById(readModelClient: ReadModelClient, collectionName: string, tenantId: string): Promise<PersistentTenant> {
  const result = await readModelClient.db()
    .collection<{ data: PersistentTenant }>(collectionName)
    .aggregate([
      {
        $match: {
          'data.id': tenantId,
        }
      },
      {
        $project: projectUnrevokedCertifiedAttributes
      }
    ])
    .map(({ data }) => PersistentTenant.parse(data))
    .toArray()

  if (result.length === 0)
    throw Error(`Tenant with id ${tenantId} not found`)
  else
    return result[0]
}

export async function getAttributeByExternalId(readModelClient: ReadModelClient, collectionName: string, origin: string, code: string): Promise<PersistentAttribute> {
  const result = await readModelClient.db()
    .collection<{ data: PersistentAttribute }>(collectionName)
    .find(
      {
        'data.origin': origin,
        'data.code': code,
      },
      {
        projection: {
          '_id': 0,
          'data.id': 1,
          'data.origin': 1,
          'data.code': 1,
        }
      }
    )
    .map(({ data }) => PersistentAttribute.parse(data))
    .toArray()

  if (result.length === 0)
    throw Error(`Attribute with origin ${origin} and code ${code} not found`)
  else
    return result[0]
}
