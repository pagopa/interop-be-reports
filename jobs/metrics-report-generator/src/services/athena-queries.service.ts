import { AthenaClientService } from '@interop-be-reports/commons'
import { env } from '../configs/env.js'
import { z } from 'zod'

export const TokensDataQueryResult = z.object({
  agreementId: z.string(),
  purposeId: z.string(),
  date: z.string(),
  tokencount: z.string(),
  tokenDuration: z.string(),
})
export type TokensDataQueryResult = z.infer<typeof TokensDataQueryResult>

export class TokensQueriesService {
  private athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  public async getTokensData(): Promise<TokensDataQueryResult[]> {
    const { ResultSet } = await this.athena.query(`
      SELECT
        agreementid,
        purposeid,
        day,
        tokenDuration,
        count(*) as tokens
      FROM
        (
          SELECT
            agreementid,
            purposeid,
            date_format(from_unixtime(cast(issuedAt as bigint) / 1000), '%Y-%m-%d') as day,
            expirationTime - issuedAt as tokenDuration
          FROM
            ${env.ATHENA_TOKENS_DB_NAME} 
        )
      GROUP BY
        agreementid,
        purposeid,
        day,
        tokenDuration
    `)

    if (!ResultSet?.Rows) throw new Error('Invalid result set')

    return ResultSet.Rows.slice(1).map((row) => {
      if (!row.Data) throw new Error('Invalid row data')

      const [agreementId, purposeId, date, tokenDuration, tokencount] = row.Data.map((data) => data.VarCharValue)

      return TokensDataQueryResult.parse({
        agreementId,
        purposeId,
        date,
        tokencount,
        tokenDuration,
      })
    })
  }
}
