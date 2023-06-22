import { MongoClient } from "mongodb";
import { env } from "../configs/env.js";
import { EService, eserviceSchema, Attribute, attributeSchema, Tenant, tenantSchema } from "../models/index.js";

export class MongoDBEServiceClient {
  private client: MongoClient;

  private constructor(client: MongoClient) {
    this.client = client;
  }

  /**
   * Connects to the mongodb database
   */
  public static async connect() {
    const connectionString = `mongodb://${env.READ_MODEL_DB_USER}:${env.READ_MODEL_DB_PASSWORD}@${env.READ_MODEL_DB_HOST}:${env.READ_MODEL_DB_PORT}?directConnection=true&readPreference=secondaryPreferred&retryWrites=false`;
    const client = await new MongoClient(connectionString).connect();
    return new MongoDBEServiceClient(client);
  }

  /**
   * Fetches all active e-services from the database, validates them and returns them.
   * The e-services is considered active if it has at least one descriptor with state "Published" or "Suspended".
   *
   * @returns The array of e-services
   */
  async getEServices() {
    return await this.client
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
   * @param attributeIds - The array of attributes ids
   * @returns The array of attributes
   **/
  async getEServicesAttributes(attributeIds: Array<string>) {
    return await this.client
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
   * @param eservices - The array of e-services which all the attributes ids will be taken from
   * @returns The array of attributes
   **/
  async getEServicesTenants(tenantIds: Array<string>) {
    return await this.client
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

  /**
   * Closes the connection to the database
   * */
  async close() {
    await this.client.close();
  }
}
