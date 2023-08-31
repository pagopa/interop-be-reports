import axios from 'axios';
import { InteropContext } from '../model/interop-context.js';
import { SelfcareTenantSeed, SelfcareUpsertTenantResponse } from '../model/tenant-process.js';
import { error as logError } from '../utils/logger.js';

export class TenantProcessService {

  constructor(private tenantProcessUrl: string) { }

  public async selfcareUpsertTenant(seed: SelfcareTenantSeed, context: InteropContext): Promise<SelfcareUpsertTenantResponse> {
    const { data } = await axios.post<SelfcareUpsertTenantResponse>(
      `${this.tenantProcessUrl}/selfcare/tenants`,
      seed,
      {
        headers: {
          'X-Correlation-Id': context.correlationId,
          'Authorization': `Bearer ${context.bearerToken}`,
          'Content-Type': 'application/json',
        },
      },
    ).catch(error => {
      logError(context.correlationId, `Error on selfcareUpsertTenant. Reason: ${error.message}`)
      throw Error(`Unexpected response from selfcareUpsertTenant. Reason: ${error.message}`)
    });

    return data;
  }

}
