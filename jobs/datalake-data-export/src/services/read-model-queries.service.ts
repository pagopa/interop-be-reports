import { ReadModelClient } from '@interop-be-reports/commons'
import { ExportedAgreement, ExportedEService, ExportedPurpose, ExportedTenant } from '../models.js'

export class ReadModelQueriesService {
  constructor(private readonly readModel: ReadModelClient) {}

  public async getTenants(): Promise<Array<ExportedTenant>> {
    return this.readModel.tenants
      .find({ 'data.selfcareId': { $exists: true } })
      .map(({ data }) => ExportedTenant.parse(data))
      .toArray()
  }

  public async getEServices(): Promise<Array<ExportedEService>> {
    return this.readModel.eservices
      .find()
      .map(({ data }) => ExportedEService.parse(data))
      .toArray()
  }

  public async getAgreements(): Promise<Array<ExportedAgreement>> {
    return this.readModel.agreements
      .find()
      .map(({ data }) => ExportedAgreement.parse(data))
      .toArray()
  }

  public async getPurposes(): Promise<Array<ExportedPurpose>> {
    return this.readModel.purposes
      .find()
      .map(({ data }) => ExportedPurpose.parse(data))
      .toArray()
  }
}
