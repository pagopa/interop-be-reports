import { ReadModelClient } from '@interop-be-reports/commons'
import { Collection, Document, Filter, ReadPreferenceMode } from 'mongodb'
import { z } from 'zod'
import { AgreementQueryData, EServiceQueryData, PurposeQueryData, TenantQueryData } from '../models/query-data.model.js'
import { env } from '../configs/env.js'

const QUERY_LIMIT_SIZE = 10_000

export class ReadModelQueriesService {
  private constructor(private readModel: ReadModelClient) {}

  static async connect(): Promise<ReadModelQueriesService> {
    const readModel = await ReadModelClient.connect({
      mongodbReplicaSet: env.MONGODB_REPLICA_SET,
      mongodbDirectConnection: env.MONGODB_DIRECT_CONNECTION,
      mongodbReadPreference: env.MONGODB_READ_PREFERENCE as ReadPreferenceMode,
      mongodbRetryWrites: env.MONGODB_RETRY_WRITES,
      readModelDbHost: env.READ_MODEL_DB_HOST,
      readModelDbPort: env.READ_MODEL_DB_PORT,
      readModelDbUser: env.READ_MODEL_DB_USER,
      readModelDbPassword: env.READ_MODEL_DB_PASSWORD,
      readModelDbName: env.READ_MODEL_DB_NAME,
    })

    return new ReadModelQueriesService(readModel)
  }

  public async getAllEServices(): Promise<EServiceQueryData[]> {
    return await this.getAll({
      collection: this.readModel.eservices,
      schema: EServiceQueryData,
      projection: {
        _id: 0,
        'data.id': 1,
        'data.name': 1,
        'data.producerId': 1,
        'data.descriptors.id': 1,
        'data.descriptors.createdAt': 1,
        'data.descriptors.state': 1,
        'data.descriptors.interface.checksum': 1,
      },
    })
  }

  public async getAllAgreements(): Promise<AgreementQueryData[]> {
    return await this.getAll({
      collection: this.readModel.agreements,
      schema: AgreementQueryData,
      projection: {
        _id: 0,
        'data.id': 1,
        'data.consumerId': 1,
        'data.producerId': 1,
        'data.eserviceId': 1,
        'data.descriptorId': 1,
        'data.state': 1,
      },
    })
  }

  public async getAllPurposes(): Promise<PurposeQueryData[]> {
    return await this.getAll({
      collection: this.readModel.purposes,
      schema: PurposeQueryData,
      projection: { _id: 0, 'data.id': 1, 'data.title': 1, 'data.eserviceId': 1 },
    })
  }

  public async getAllTenantsByIds(ids: string[]): Promise<TenantQueryData[]> {
    return await this.getAll({
      collection: this.readModel.tenants,
      schema: TenantQueryData,
      projection: { _id: 0, 'data.id': 1, 'data.externalId': 1 },
      filter: { 'data.id': { $in: ids } },
    })
  }

  private async getAll<TCollection extends Document, TSchema extends z.Schema, TResult extends z.infer<TSchema>>({
    collection,
    schema,
    projection,
    filter = {},
  }: {
    collection: Collection<TCollection>
    schema: TSchema
    projection?: Document
    filter?: Filter<TCollection>
  }): Promise<TResult[]> {
    const results: TResult[] = []
    let docs: TResult[]

    do {
      docs = (await collection
        .find(filter, { projection })
        .map(({ data }) => schema.parse(data))
        .limit(QUERY_LIMIT_SIZE)
        .skip(results.length)
        .toArray()) as TResult[]

      results.push(...docs)
    } while (docs.length > 0)

    return results
  }

  public async close(): Promise<void> {
    await this.readModel.close()
  }
}
