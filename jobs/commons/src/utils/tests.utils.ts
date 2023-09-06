import { cloneDeep, merge } from 'lodash'
import { EService, Attribute, Tenant, Agreement } from '../models/index.js'

/**
 * Create and returns a mock factory function
 */
function createMockFactory<TDefaultValue>(defaultValue: TDefaultValue) {
  type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>
  }
  return <T>(overwrites: RecursivePartial<TDefaultValue> = {}) => {
    return merge(cloneDeep(defaultValue), overwrites) as T
  }
}

export const getEServiceMock = createMockFactory<EService>({
  description: 'Questo è un e-service con tanti attributi',
  descriptors: [
    {
      id: 'a9c705d9-ecdb-47ff-bcd2-667495b111f2',
      state: 'Published',
      version: '1',
      attributes: {
        certified: [
          {
            ids: [
              {
                explicitAttributeVerification: false,
                id: '929188a4-bbc8-4509-8999-b2d424de3870',
              },
              {
                explicitAttributeVerification: false,
                id: 'f9d7acb2-dc06-4ff2-be76-498179e7f2e9',
              },
            ],
          },
          {
            id: {
              explicitAttributeVerification: false,
              id: 'c9b5542e-3890-4e04-85ae-27101a9e13f1',
            },
          },
        ],
        verified: [
          {
            ids: [
              {
                explicitAttributeVerification: false,
                id: 'db7e7161-1fff-478a-9a1f-c095e195c732',
              },
              {
                explicitAttributeVerification: false,
                id: '40a01d40-acd0-4fde-8f8f-41f9fec593e1',
              },
            ],
          },
          {
            id: {
              explicitAttributeVerification: false,
              id: '77055d15-0bed-4ca4-a96c-0ecda4ca8613',
            },
          },
        ],
        declared: [
          {
            ids: [
              {
                explicitAttributeVerification: false,
                id: '036307c0-b621-4d08-99b1-c850acfce6fe',
              },
              {
                explicitAttributeVerification: false,
                id: 'b77f0735-e024-4563-81a0-ec356b71bf1d',
              },
            ],
          },
          {
            id: {
              explicitAttributeVerification: false,
              id: '922dfb09-f979-42d5-b801-eb8fecedccef',
            },
          },
        ],
      },
      docs: [],
      serverUrls: [],
      voucherLifespan: 1,
      dailyCallsPerConsumer: 1,
      dailyCallsTotal: 1,
      audience: ['audience'],
      createdAt: new Date(),
      agreementApprovalPolicy: 'Automatic',
    },
  ],
  id: '4747d063-0d9c-4a5d-b143-9f2fdc4d7f22',
  name: 'Servizio con tanti attributi',
  producerId: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
  technology: 'Rest',
  createdAt: new Date(),
})

export const getAttributeMock = createMockFactory<Attribute>({
  id: '929188a4-bbc8-4509-8999-b2d424de3870',
  name: 'Nome attributo 1',
  description: 'Descrizione attributo 1',
  code: 'L6',
  kind: 'Certified',
  creationTime: new Date(),
})

export const getTenantMock = createMockFactory<Tenant>({
  id: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
  name: 'Nome produttore 1',
  attributes: [],
  createdAt: new Date(),
  externalId: {
    origin: 'origin',
    value: 'value',
  },
  features: [],
  mails: [],
})

export const getAgreementMock = createMockFactory<Agreement>({
  id: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
  eserviceId: '4747d063-0d9c-4a5d-b143-9f2fdc4d7f22',
  consumerId: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
  producerId: '5ec5dd81-ff71-4af8-974b-4190eb8347bf',
  state: 'Active',
  descriptorId: 'a9c705d9-ecdb-47ff-bcd2-667495b111f2',
  certifiedAttributes: [],
  verifiedAttributes: [],
  declaredAttributes: [],
  consumerDocuments: [],
  stamps: {},
  createdAt: new Date(),
})
