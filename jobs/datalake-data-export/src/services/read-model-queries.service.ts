import { ReadModelClient } from '@interop-be-reports/commons'
import { ExportedTenant } from '../models.js'

export class ReadModelQueriesService {
  constructor(private readonly readModel: ReadModelClient) {}

  public async getTenants(): Promise<Array<ExportedTenant>> {
    return this.readModel.tenants
      .find({ 'data.selfcareId': { $exists: true } })
      .map(({ data }) => ExportedTenant.parse(data))
      .toArray()
  }

  public async getEServices(): Promise<Array<unknown>> {
    return []
  }

  public async getAgreements(): Promise<Array<unknown>> {
    return []
  }

  public async getPurposes(): Promise<Array<unknown>> {
    return []
  }
}
