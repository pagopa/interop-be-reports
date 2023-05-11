import { MongoClient } from "mongodb";
import { env } from "../env.js";
import { EService, eserviceSchema } from "../models/EService.js";
import { Attribute, attributeSchema } from "../models/Attribute.js";
import { Tenant, tenantSchema } from "../models/Tenant.js";

/**
 * Connects to the mongodb database
 * @returns The mongodb database client
 */
export async function connectToDatabase() {
  const connectionString = `mongodb://${env.READ_MODEL_DB_USER}:${env.READ_MODEL_DB_PASSWORD}@${env.READ_MODEL_DB_HOST}:${env.READ_MODEL_DB_PORT}?directConnection=true&readPreference=secondaryPreferred&retryWrites=false`;
  return await new MongoClient(connectionString).connect();
}

/**
 * Fetches all active e-services from the database, validates them and returns them.
 * The e-services is considered active if it has at least one descriptor with state "Published" or "Suspended".
 *
 * @param client - The mongodb database client
 * @returns The array of e-services
 */
export async function getEServices(client: MongoClient) {
  return await client
    .db(env.READ_MODEL_DB_NAME)
    .collection<EService>(env.ESERVICES_COLLECTION_NAME)
    .aggregate([
      {
        $match: {
          "data.descriptors": {
            $elemMatch: {
              state: {
                $in: ["Published", "Suspended"],
              },
            },
          },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$data",
        },
      },
    ])
    .map(eserviceSchema.parse)
    .toArray();
}

/**
 * Does the following:
 * - Then fetches all the attributes from the database filtering by the passed attribute ids;
 * - Validates the array of attributes;
 * - Transforms the array of attributes into a map of attributes (id -> attribute) and returns it;
 *
 * @param client - The mongodb database client
 * @param attributeIds - The array of attributes ids
 * @returns The array of attributes
 **/
export async function getEServicesAttributes(
  client: MongoClient,
  attributeIds: Array<string>
) {
  return await client
    .db(env.READ_MODEL_DB_NAME)
    .collection<Attribute>(env.ATTRIBUTES_COLLECTION_NAME)
    .aggregate([
      {
        $match: {
          "data.id": { $in: attributeIds },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$data",
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
          description: 1,
        },
      },
    ])
    .map(attributeSchema.parse)
    .toArray();
}

/**
 * Does the following:
 * - Then fetches all the tenants from the database filtering by the passed tenant ids;
 * - Validates the array of tenants;
 * - Transforms the array of tenants into a map of tenants (id -> tenant) and returns it;
 *
 * @param client - The mongodb database client
 * @param eservices - The array of e-services which all the attributes ids will be taken from
 * @returns The array of attributes
 **/
export async function getEServicesTenants(
  client: MongoClient,
  tenantIds: Array<string>
) {
  return await client
    .db(env.READ_MODEL_DB_NAME)
    .collection<Tenant>(env.TENANTS_COLLECTION_NAME)
    .aggregate([
      {
        $match: {
          "data.id": { $in: tenantIds },
        },
      },
      {
        $replaceRoot: {
          newRoot: "$data",
        },
      },
      {
        $project: {
          _id: 0,
          id: 1,
          name: 1,
        },
      },
    ])
    .map(tenantSchema.parse)
    .toArray();
}
