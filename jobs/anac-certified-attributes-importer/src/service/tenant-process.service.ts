import axios from 'axios';
import { InteropContext } from '../model/interop-context.js';
import { error } from '../utils/logger.js';

export class TenantProcessService {

  constructor(private tenantProcessUrl: string) { }

  public async internalAssignCertifiedAttribute(tenantOrigin: string, tenantExternalId: string, attributeOrigin: string, attributeExternalId: string, context: InteropContext): Promise<void> {
    const { data } = await axios.post<void>(
      `${this.tenantProcessUrl}/internal/origin/${tenantOrigin}/externalId/${tenantExternalId}/attributes/origin/${attributeOrigin}/externalId/${attributeExternalId}`,
      {
        headers: {
          'X-Correlation-Id': context.correlationId,
          'Authorization': `Bearer ${context.bearerToken}`,
          'Content-Type': 'application/json',
        },
      },
    ).catch(err => {
      error(context.correlationId, `Error on selfcareUpsertTenant. Reason: ${err.message}`)
      throw Error(`Unexpected response from internalAssignCertifiedAttribute. Reason: ${err.message}`)
    });
    return data;
  }

}
