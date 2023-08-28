import axios from 'axios';
import { InteropContext } from '../model/interop-context.js';
import { SelfcareTenantSeed, SelfcareUpsertTenantResponse } from '../model/tenant-process.js';

export class TenantProcessService {

  constructor(private tenantProcessUrl: string) { }

  public async selfcareUpsertTenant(seed: SelfcareTenantSeed, context: InteropContext): Promise<SelfcareUpsertTenantResponse> {
    const { data, status } = await axios.post<SelfcareUpsertTenantResponse>(
      `${this.tenantProcessUrl}/selfcare/tenants`,
      seed,
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
