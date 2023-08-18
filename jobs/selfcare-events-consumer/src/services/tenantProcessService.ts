import axios from 'axios';
import { InteropContext } from '../model/InteropContext.js';

type SelfcareUpsertTenantResponse = {
  id: string
}

export class TenantProcessService {

  constructor(private tenantProcessUrl: string) { }

  public async selfcareUpsertTenant(context: InteropContext): Promise<SelfcareUpsertTenantResponse> {
    const { data, status } = await axios.post<SelfcareUpsertTenantResponse>(
      `${this.tenantProcessUrl}/selfcare/tenants`,
      {
        headers: {
          'X-Correlation-Id': context.correlationId,
          'Authorization': `Bearer ${context.bearerToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (status >= 400) {
      console.log(`Error on selfcareUpsertTenant. Status ${status}. Response ${data}`)
      throw Error("Unexpected response from selfcareUpsertTenant")
    }

    return data;
  }

}
