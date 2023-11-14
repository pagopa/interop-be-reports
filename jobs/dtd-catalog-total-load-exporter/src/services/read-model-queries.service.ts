import { Attribute, Attributes, ReadModelClient, TENANTS_COLLECTION_NAME } from '@interop-be-reports/commons'
import { z } from 'zod'
import { EServiceQueryOutput } from '../models/eservice-result.model.js'

export async function getEServices(readModel: ReadModelClient): Promise<Array<EServiceQueryOutput>> {
  return await readModel.eservices
    .aggregate([
      {
        $match: { 'data.descriptors.state': { $in: ['Published', 'Suspended'] } },
      },
      {
        $lookup: {
          from: TENANTS_COLLECTION_NAME,
          localField: 'data.producerId',
          foreignField: 'data.id',
          as: 'producer',
        },
      },
      {
        $addFields: {
          'data.producerName': { $arrayElemAt: ['$producer.data.name', 0] },
        },
      },
    ])
    .map(({ data }) => EServiceQueryOutput.parse(data))
    .toArray()
}

/**
 * Get the total load of all the active purposes of the given e-services.
 */
export async function getTotalLoadEServices(
  readModel: ReadModelClient,
  eservicesIds: Array<string>
): Promise<Array<{ eserviceId: string; actualLoad: number }>> {
  return await readModel.purposes
    .aggregate([
      {
        $match: {
          'data.eserviceId': { $in: eservicesIds },
          'data.versions.state': { $eq: 'Active' },
        },
      },
      {
        $addFields: {
          activeVersion: {
            $filter: {
              input: '$data.versions',
              as: 'version',
              cond: { $eq: ['$$version.state', 'Active'] },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          eserviceId: '$data.eserviceId',
          dailyCalls: { $arrayElemAt: ['$activeVersion.dailyCalls', 0] },
        },
      },
      {
        $group: {
          _id: '$eserviceId',
          actualLoad: { $sum: '$dailyCalls' },
        },
      },
      {
        $project: {
          _id: 0,
          eserviceId: '$_id',
          actualLoad: '$actualLoad',
        },
      },
    ])
    .map((result) => z.object({ eserviceId: z.string(), actualLoad: z.number() }).parse(result))
    .toArray()
}

export async function getAttributes(readModel: ReadModelClient, attributeIds: Array<string>): Promise<Attributes> {
  return readModel.attributes
    .find({ 'data.id': { $in: attributeIds } })
    .map(({ data }) => Attribute.parse(data))
    .toArray()
}
