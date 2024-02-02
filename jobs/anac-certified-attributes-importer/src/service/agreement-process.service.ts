import axios from 'axios'
import { InteropContext } from '../model/index.js'
import { logError } from '@interop-be-reports/commons'

export class AgreementProcessService {
  constructor(private agreementProcessUrl: string) { }

  public async archiveAgreement(
    agreementId: string,
    context: InteropContext
  ): Promise<void> {
    const { data } = await axios
      .post<void>(
        `${this.agreementProcessUrl}/agreements/${agreementId}/archive`,
        undefined,
        {
          headers: {
            'X-Correlation-Id': context.correlationId,
            'Authorization': `Bearer ${context.bearerToken}`,
            'Content-Type': false,
          },
        }
      )
      .catch((err) => {
        logError(context.correlationId, `Error on archiveAgreement. Reason: ${err.message}`)
        throw Error(`Unexpected response from archiveAgreement. Reason: ${err.message}`)
      })
    return data
  }

}
