import { ReadModelClient } from '@interop-be-reports/commons'
import { EService } from '../models/eservice.model.js'
import { z } from 'zod'

/**
 * Get all the active e-services with the dailyCallsTotal, dailyCallsPerConsumer and voucherLifespan
 * of their actual active descriptor.
 */
export async function getEServices(readModel: ReadModelClient): Promise<Array<EService>> {
  return await readModel.eservices
    .aggregate([
      {
        $match: { 'data.descriptors.state': { $in: ['Published', 'Suspended'] } },
      },
      {
        $addFields: {
          activeDescriptor: {
            $filter: {
              input: '$data.descriptors',
              as: 'descriptor',
              cond: {
                $or: [{ $eq: ['$$descriptor.state', 'Published'] }, { $eq: ['$$descriptor.state', 'Suspended'] }],
              },
            },
          },
        },
      },
      {
        $project: {
          id: '$data.id',
          name: '$data.name',
          dailyCallsTotal: { $arrayElemAt: ['$activeDescriptor.dailyCallsTotal', 0] },
          dailyCallsPerConsumer: { $arrayElemAt: ['$activeDescriptor.dailyCallsPerConsumer', 0] },
          voucherLifespan: { $arrayElemAt: ['$activeDescriptor.voucherLifespan', 0] },
        },
      },
    ])
    .map((eservice) => EService.parse(eservice))
    .toArray()
}

/**
 * Get the total load of all the active purposes of the given e-services.
 */
export async function getTotalLoadEServices(
  readModel: ReadModelClient,
  eservicesIds: Array<string>
): Promise<Array<{ id: string; actualLoad: number }>> {
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
          id: '$_id',
          actualLoad: '$actualLoad',
        },
      },
    ])
    .map((result) => z.object({ id: z.string(), actualLoad: z.number() }).parse(result))
    .toArray()
}
