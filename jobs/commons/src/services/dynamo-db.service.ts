import { AttributeValue, DynamoDB, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

/**
 * DynamoDB does not support nested object keys, this type removes all keys that contain objects.
 */
export type DynamoDBKeyOf<T> = Partial<{
  [K in keyof T as T[K] extends object ? never : K]: T[K] extends object ? never : T[K]
}>

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export class DynamoDbTableClient<
  TSchema extends Record<string, unknown> = Record<string, AttributeValue>,
> {
  private client: DynamoDB

  constructor(
    private tableName: string,
    config: Omit<DynamoDBClientConfig, 'region'> = {}
  ) {
    this.client = new DynamoDB({
      region: 'eu-central-1',
      ...config,
    })
  }

  /**
   * Get all the records in the table.
   * @returns The list of records in the table.
   */
  public async getAll() {
    const result = await this.client.scan({ TableName: this.tableName })
    return (result.Items ?? []).map((item) => unmarshall(item)) as Array<TSchema>
  }

  /**
   * Get the item with the given key in the given table.
   * @param tableName The name of the table.
   * @param key The key of the item.
   * @returns The item with the given key in the given table.
   * */
  public async getSingle(key: DynamoDBKeyOf<TSchema>) {
    const result = await this.client.getItem({
      TableName: this.tableName,
      Key: marshall(key),
    })
    return result.Item ? (unmarshall(result.Item) as TSchema) : undefined
  }

  /**
   * Update the item with the given key.
   * @param key The key of the item.
   * @param updateExpression The update expression to use.
   * @returns The result of the update.
   */
  public async updateItem(key: DynamoDBKeyOf<TSchema>, updatedObj: DeepPartial<TSchema>) {
    return await this.client.updateItem({
      TableName: this.tableName,
      Key: marshall(key),
      ...this.generateUpdateExpression(updatedObj),
    })
  }

  /**
   * Delete the item with the given key.
   * @param key The key of the item.
   * @returns The result of the deletion.
   */
  public async deleteItem(key: DynamoDBKeyOf<TSchema>) {
    return await this.client.deleteItem({
      TableName: this.tableName,
      Key: marshall(key),
    })
  }

  /**
   * This is a helper function that generates the update expression and the expression attribute values based on the given object
   * for the dynamo DB update command.
   * @param updatedObj The object to generate the update expression for.
   * @returns The update expression and the expression attribute values.
   * */
  private generateUpdateExpression(updatedObj: DeepPartial<TSchema>) {
    return {
      UpdateExpression: `SET ${Object.keys(updatedObj)
        .map((key) => `${key} = :${key}`)
        .join(', ')}`
        .replace(/, $/, '')
        .trim(),
      ExpressionAttributeValues: marshall(
        Object.entries(updatedObj).reduce<Record<string, AttributeValue>>((acc, [key, value]) => {
          acc[`:${key}`] = value as AttributeValue
          return acc
        }, {})
      ),
    }
  }
}
