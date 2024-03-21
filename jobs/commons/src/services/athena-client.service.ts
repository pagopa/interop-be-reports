import {
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  GetQueryResultsCommandOutput,
  StartQueryExecutionCommand,
  AthenaClient,
} from '@aws-sdk/client-athena'

const POLL_QUERY_EXECUTION_TIMEOUT_MS = 2 * 1000
const POLL_QUERY_EXECUTION_RETRIES = 100

type AthenaServiceConfig = {
  outputLocation: string
}

export class AthenaClientService {
  private athena = new AthenaClient()

  constructor(private config: AthenaServiceConfig) {}

  public async query(query: string): Promise<GetQueryResultsCommandOutput> {
    // Starts the query execution
    const response = await this.athena.send(
      new StartQueryExecutionCommand({
        QueryString: query,
        ResultConfiguration: {
          OutputLocation: this.config.outputLocation,
        },
      })
    )

    const QueryExecutionId = response.QueryExecutionId

    if (!QueryExecutionId)
      throw new Error(
        `Query execution failed: no QueryExecutionId returned from Athena\n\n${JSON.stringify(response, null, 2)}`
      )

    // Polls until the query execution is complete
    await this.pollUntilComplete(QueryExecutionId)

    let nextToken: string | undefined
    let result: GetQueryResultsCommandOutput | undefined

    do {
      const queryResult = await this.athena.send(new GetQueryResultsCommand({ QueryExecutionId, NextToken }))
      NextToken = queryResult.NextToken
      if (!result) result = queryResult
      else if (queryResult.ResultSet?.Rows) result.ResultSet?.Rows?.push(...queryResult.ResultSet.Rows)
    } while (NextToken)

    if (!result) throw new Error('No result was returned from Athena')

    return result
  }

  private async pollUntilComplete(queryExecutionId: string, retries = POLL_QUERY_EXECUTION_RETRIES): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, POLL_QUERY_EXECUTION_TIMEOUT_MS))

    // Asks for the query execution status
    const data = await this.athena.send(
      new GetQueryExecutionCommand({
        QueryExecutionId: queryExecutionId,
      })
    )

    switch (data.QueryExecution?.Status?.State) {
      // If the query is still running, continue
      case 'QUEUED':
      case 'RUNNING':
        break
      // If the query is finished, exit the function
      case 'SUCCEEDED':
        return
      // If the query failed, throw an error
      case 'CANCELLED':
      case 'FAILED':
        throw new Error(`Query execution failed: ${data.QueryExecution?.Status?.StateChangeReason}`)
      default:
        throw new Error(`Invalid query execution status: ${data.QueryExecution?.Status?.State}`)
    }

    // If the query is still running and we reached the maximum number of retries, throw an error
    if (retries === 0) throw new Error('Query execution timed out: too many retries')

    // Retry
    await this.pollUntilComplete(queryExecutionId, retries - 1)
  }
}
