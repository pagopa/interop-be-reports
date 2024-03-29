import { MongoClient } from 'mongodb'
import { env } from '../configs/env.js'
import { EService, EServices } from '@interop-be-reports/commons'
import { Attribute, Tenant } from '../models/index.js'

export class MongoDBEServiceClient {
  private client: MongoClient

  private constructor(client: MongoClient) {
    this.client = client
  }

  /**
   * Connects to the mongodb database
   */
  public static async connect(): Promise<MongoDBEServiceClient> {
    const connectionConfig = {
      replicaSet: 'rs0',
      readPreference: 'secondaryPreferred',
    } as const

    // Use this config instead if you want to connect to a mongodb instance locally using a tunnel
    // const connectionConfig = {
    //   directConnection: true,
    //   readPreference: 'secondaryPreferred',
    //   retryWrites: false,
    // } as const

    const connectionString = `mongodb://${env.READ_MODEL_DB_USER}:${env.READ_MODEL_DB_PASSWORD}@${env.READ_MODEL_DB_HOST}:${env.READ_MODEL_DB_PORT}`
    const client = await new MongoClient(connectionString, connectionConfig).connect()
    return new MongoDBEServiceClient(client)
  }

  /**
   * Fetches all active e-services from the database, validates them and returns them.
   * The e-services is considered active if it has at least one descriptor with state "Published" or "Suspended".
   *
   * @returns The array of e-services
   */
  async getEServices(): Promise<EServices> {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: EService }>(env.ESERVICES_COLLECTION_NAME)
      .find(
        { 'data.descriptors.state': { $in: ['Published', 'Suspended'] } },
        { projection: { _id: 0, metadata: 0 } }
      )
      .map(({ data }) => EService.parse(data))
      .toArray()
  }

  /**
   * Fetches all the attributes from the database filtering by the passed attribute ids;
   *
   * @param attributeIds - The array of attributes ids
   * @returns The array of attributes
   **/
  async getEServicesAttributes(attributeIds: Array<string>): Promise<Array<Attribute>> {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: Attribute }>(env.ATTRIBUTES_COLLECTION_NAME)
      .find(
        { 'data.id': { $in: attributeIds } },
        { projection: { _id: 0, 'data.id': 1, 'data.name': 1, 'data.description': 1 } }
      )
      .map(({ data }) => Attribute.parse(data))
      .toArray()
  }
  /**
   * Fetches all the tenants from the database filtering by the passed tenant ids;
   *
   * @param eservices - The array of e-services which all the attributes ids will be taken from
   * @returns The array of attributes
   **/
  async getEServicesTenants(tenantIds: Array<string>): Promise<Array<Tenant>> {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: Tenant }>(env.TENANTS_COLLECTION_NAME)
      .find(
        { 'data.id': { $in: tenantIds } },
        { projection: { _id: 0, 'data.id': 1, 'data.name': 1 } }
      )
      .map(({ data }) => Tenant.pick({ id: true, name: true }).parse(data))
      .toArray()
  }

  /**
   * Closes the connection to the database
   * */
  async close(): Promise<void> {
    await this.client.close()
  }
}
