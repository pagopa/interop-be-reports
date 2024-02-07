import { ReadModelClient } from '@interop-be-reports/commons'

export class ReadModelQueriesService {
  constructor(private readonly readModel: ReadModelClient) {}

  public async getOnboardedTenants(): Promise<Array<unknown>> {
    return []
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
