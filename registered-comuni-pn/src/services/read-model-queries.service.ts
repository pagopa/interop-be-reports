import { MongoClient } from 'mongodb'
import { env } from '../configs/env.js'
import { Tenant, tenantSchema, purposeSchema, Purpose } from '../models/index.js'
import {
  COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID,
  PN_ESERVICE_ID,
} from '../configs/constants.js'

export class ReadModelQueriesClient {
  private client: MongoClient

  private constructor(client: MongoClient) {
    this.client = client
  }

  /**
   * Connects to the mongodb database
   */
  public static async connect() {
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
    return new ReadModelQueriesClient(client)
  }

  /**
   * Retrieves all the purposes related to the e-service with id PN_ESERVICE_ID, having at
   * least one version with state Active, Suspended or WaitingForApproval.
   */
  async getPNEServicePurposes() {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: Purpose }>(env.PURPOSES_COLLECTION_NAME)
      .find(
        {
          'data.eserviceId': PN_ESERVICE_ID,
          'data.versions': {
            $elemMatch: {
              state: { $in: ['Active', 'Suspended', 'WaitingForApproval'] },
            },
          },
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.consumerId': 1,
            'data.versions.firstActivationAt': 1,
            'data.versions.state': 1,
          },
        }
      )
      .map(({ data }) => purposeSchema.parse(data))
      .toArray()
  }

  /**
   * Retrieves all the tenants filtered by the provided ids array and having
   * the certified attribute "Comuni e loro consorzi e associazioni".
   *
   * @param tenantsIds - The ids of the tenants to retrieve
   * @returns The tenants
   **/
  async getComuniByTenantsIds(tenantsIds: Set<string>) {
    return await this.client
      .db(env.READ_MODEL_DB_NAME)
      .collection<{ data: Tenant }>(env.TENANTS_COLLECTION_NAME)
      .find(
        {
          'data.id': { $in: tenantsIds },
          'data.attributes': {
            $elemMatch: { id: COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID },
          },
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.name': 1,
          },
        }
      )
      .map(({ data }) => tenantSchema.parse(data))
      .toArray()
  }

  /**
   * Closes the connection to the database
   * */
  async close() {
    await this.client.close()
  }
}
