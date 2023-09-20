import { env } from '../configs/env.js'
import { PurposeState, ReadModelClient } from '@interop-be-reports/commons'
import { Purpose, Tenant } from '../models/index.js'

export class ReadModelQueriesClient {
  constructor(private readModel: ReadModelClient) {}

  /**
   * Retrieves all the purposes related to the e-service with id PN_ESERVICE_ID, having at
   * least one version with state Active, Suspended or WaitingForApproval.
   */
  async getPNEServicePurposes(): Promise<Array<Purpose>> {
    return await this.readModel.purposes
      .find(
        {
          'data.eserviceId': env.PN_ESERVICE_ID,
          'data.versions.state': {
            $in: ['Active', 'Suspended', 'WaitingForApproval'] satisfies Array<PurposeState>,
          },
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.consumerId': 1,
            'data.versions.firstActivationAt': 1,
            'data.versions.state': 1,
            'data.versions.dailyCalls': 1,
          },
        }
      )
      .map(({ data }) => Purpose.parse(data))
      .toArray()
  }

  /**
   * Retrieves all the tenants filtered by the provided ids array and having
   * the certified attribute "Comuni e loro consorzi e associazioni".
   *
   * @param tenantsIds - The ids of the tenants to retrieve
   * @returns The tenants
   **/
  async getComuniByTenantsIds(tenantsIds: Array<string>): Promise<Array<Tenant>> {
    return await this.readModel.tenants
      .find(
        {
          'data.id': { $in: tenantsIds },
          'data.attributes': {
            $elemMatch: { id: env.COMUNI_E_LORO_CONSORZI_E_ASSOCIAZIONI_ATTRIBUTE_ID },
          },
        },
        {
          projection: {
            _id: 0,
            'data.id': 1,
            'data.name': 1,
            'data.externalId': 1,
          },
        }
      )
      .map(({ data }) => Tenant.parse(data))
      .toArray()
  }

  /**
   * Closes the connection to the database
   * */
  async close(): Promise<void> {
    await this.readModel.close()
  }
}
