import { getEServiceMock } from '@interop-be-reports/commons'
import { remapEServiceToPublicEService } from '../e-service.utils.js'
import { getSafeMapFromIdentifiableRecords } from '../helpers.utils.js'

describe('remapping e-service to public e-service tests', () => {
  it('should correctly map an e-service to a public e-service', () => {
    const attributes = [
      '929188a4-bbc8-4509-8999-b2d424de3870',
      'f9d7acb2-dc06-4ff2-be76-498179e7f2e9',
      'c9b5542e-3890-4e04-85ae-27101a9e13f1',
      'db7e7161-1fff-478a-9a1f-c095e195c732',
      '40a01d40-acd0-4fde-8f8f-41f9fec593e1',
      '77055d15-0bed-4ca4-a96c-0ecda4ca8613',
      '036307c0-b621-4d08-99b1-c850acfce6fe',
      'b77f0735-e024-4563-81a0-ec356b71bf1d',
      '922dfb09-f979-42d5-b801-eb8fecedccef',
    ].map((id, i) => ({
      id,
      name: `attribute-${i}`,
      description: `attribute-${i}-description`,
      kind: 'Certified' as const,
    }))

    const attributesMap = getSafeMapFromIdentifiableRecords(attributes)

    const tenant = [
      {
        id: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
        name: 'tenant-name',
      },
    ]
    const tenantsMap = getSafeMapFromIdentifiableRecords(tenant)

    const result = remapEServiceToPublicEService(getEServiceMock(), attributesMap, tenantsMap)

    expect(result).toEqual({
      activeDescriptor: {
        id: 'a9c705d9-ecdb-47ff-bcd2-667495b111f2',
        state: 'PUBLISHED',
        version: '1',
      },
      attributes: {
        certified: [
          {
            group: [
              {
                description: 'attribute-0-description',
                name: 'attribute-0',
              },
              {
                description: 'attribute-1-description',
                name: 'attribute-1',
              },
            ],
          },
          {
            single: {
              description: 'attribute-2-description',
              name: 'attribute-2',
            },
          },
        ],
        declared: [
          {
            group: [
              {
                description: 'attribute-6-description',
                name: 'attribute-6',
              },
              {
                description: 'attribute-7-description',
                name: 'attribute-7',
              },
            ],
          },
          {
            single: {
              description: 'attribute-8-description',
              name: 'attribute-8',
            },
          },
        ],
        verified: [
          {
            group: [
              {
                description: 'attribute-3-description',
                name: 'attribute-3',
              },
              {
                description: 'attribute-4-description',
                name: 'attribute-4',
              },
            ],
          },
          {
            single: {
              description: 'attribute-5-description',
              name: 'attribute-5',
            },
          },
        ],
      },
      description: 'Questo è un e-service con tanti attributi',
      id: '4747d063-0d9c-4a5d-b143-9f2fdc4d7f22',
      name: 'Servizio con tanti attributi',
      producerName: 'tenant-name',
      technology: 'REST',
    })
  })
})
