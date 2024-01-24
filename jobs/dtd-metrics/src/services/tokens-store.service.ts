import { z } from 'zod'
import { Row } from '@aws-sdk/client-athena'
import { env } from '../configs/env.js'
import { AthenaClientService } from '@interop-be-reports/commons'
import { aggregateTokensCount } from '../utils/helpers.utils.js'

export const TokensByDay = z.array(z.object({ day: z.date(), tokens: z.number() }))
export type TokensByDay = z.infer<typeof TokensByDay>

export class TokensStore {
  private static athena = new AthenaClientService({ outputLocation: `s3://${env.ATHENA_OUTPUT_BUCKET}` })

  private static instance: TokensStore
  public tokensByDay: TokensByDay
  public totalTokens: number

  private constructor(tokensByDay: TokensByDay) {
    this.tokensByDay = tokensByDay
    this.totalTokens = aggregateTokensCount(tokensByDay)
  }

  public static async getInstance(): Promise<TokensStore> {
    if (!TokensStore.instance) {
      const tokensByDay = await this.getTokensGroupedByDay()
      TokensStore.instance = new TokensStore(tokensByDay)
    }
    return TokensStore.instance
  }

  private static async getTokensGroupedByDay(): Promise<TokensByDay> {
    const { ResultSet } = await this.athena.query(
      `
      SELECT 
        date_format(from_unixtime(cast(issuedAt as bigint) / 1000), '%Y-%m-%d') as day, 
        count(*) as tokens 
      FROM 
        ${env.ATHENA_TOKENS_DB_NAME} 
      GROUP BY 
        date_format(from_unixtime(cast(issuedAt as bigint) / 1000), '%Y-%m-%d') 
      ORDER BY 
        day ASC
      `
    )
    const parseRow = (row: Row): TokensByDay[number] => {
      const day = row.Data?.[0].VarCharValue
      const tokens = row.Data?.[1].VarCharValue

      if (!day || !tokens) throw new Error('Invalid result row')

      return { day: new Date(day), tokens: parseInt(tokens, 10) }
    }
    const result = ResultSet?.Rows?.slice(1).map(parseRow)
    return TokensByDay.parse(result)
  }
}
