import { ReadModelClient } from '@interop-be-reports/commons'
import { Collection, Document, Filter } from 'mongodb'
import { z } from 'zod'
import { AgreementQueryData, EServiceQueryData, PurposeQueryData, TenantQueryData } from '../models/query-data.model.js'

const QUERY_LIMIT_SIZE = 10_000

export class ReadModelQueries {
  constructor(private readModel: ReadModelClient) {}

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
}
