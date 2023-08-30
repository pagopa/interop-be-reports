import { MongoClient } from 'mongodb'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MetricsManager } from '../metrics-manager.js'
import {
  getAgreementMock,
  getAttributeMock,
  getEServiceMock,
  getTenantMock,
} from '@interop-be-reports/commons'
import { MacroCategory } from '../../configs/constants.js'

describe('MetricsManager', () => {
  const DB_NAME = 'read-model'
  let mongoClient: MongoClient
  let mongoServer: MongoMemoryServer
  let metricsManager: MetricsManager

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: DB_NAME,
      },
    })

    process.env.READ_MODEL_DB_NAME = DB_NAME
    process.env.ESERVICES_COLLECTION_NAME = 'eservices'
    process.env.ATTRIBUTES_COLLECTION_NAME = 'attributes'
    process.env.AGREEMENTS_COLLECTION_NAME = 'agreements'
    process.env.TENANTS_COLLECTION_NAME = 'tenants'
    process.env.PURPOSES_COLLECTION_NAME = 'purposes'

    mongoClient = await new MongoClient(mongoServer.getUri(), {}).connect()
    metricsManager = new MetricsManager(mongoClient)
  })

  afterEach(async () => {
    await mongoClient.db(DB_NAME).dropDatabase()
  })

  afterAll(async () => {
    await mongoClient?.close()
    await mongoServer?.stop()
  })

  function seedCollection(collection: string, data: Array<{ data: unknown }>) {
    return mongoClient.db(DB_NAME).collection(collection).insertMany(data)
  }

  type MacroCategoryCodeFor<TName extends MacroCategory['name']> = Extract<
    MacroCategory,
    { name: TName }
  >['codes'][number]

  it('getPublishedEServicesMetric', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ descriptors: [{ state: 'Published' }] }) },
      { data: getEServiceMock({ descriptors: [{ state: 'Suspended' }, { state: 'Draft' }] }) },
      {
        data: getEServiceMock({ descriptors: [{ state: 'Suspended' }, { state: 'Deprecated' }] }),
      },
      { data: getEServiceMock({ descriptors: [{ state: 'Draft' }] }) },
    ])

    const result = await metricsManager.getPublishedEServicesMetric()
    expect(result).toStrictEqual(3)
  })

  it('getMacroCategoriesPublishedEServicesMetric', async () => {
    await seedCollection('eservices', [
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'altra-pub-amm-loc-1',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'altra-pub-amm-loc-2',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Draft' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Suspended' }, { state: 'Deprecated' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: 'comune',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Draft' }],
          producerId: 'azienda-ospedaliera',
        }),
      },
      {
        data: getEServiceMock({
          descriptors: [{ state: 'Published' }],
          producerId: 'azienda-ospedaliera',
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'comune',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'altra-pub-amm-loc-1',
          attributes: [
            { id: 'attribute-altra-pub-amm-loc-1', type: 'PersistentCertifiedAttribute' },
          ],
        }),
      },
      {
        data: getTenantMock({
          id: 'altra-pub-amm-loc-2',
          attributes: [
            { id: 'attribute-altra-pub-amm-loc-2', type: 'PersistentCertifiedAttribute' },
          ],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera',
          attributes: [
            { id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' },
          ],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-1',
          code: 'C16' satisfies MacroCategoryCodeFor<'Altre Pubbliche Amministrazioni locali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-2',
          code: 'C1' satisfies MacroCategoryCodeFor<'Altre Pubbliche Amministrazioni locali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere'>,
        }),
      },
    ])

    const result = await metricsManager.getMacroCategoriesPublishedEServicesMetric()
    expect(
      result.find((a) => a.name === 'Altre Pubbliche Amministrazioni locali')
        ?.publishedEServicesCount
    ).toStrictEqual(2)

    expect(result.find((a) => a.name === 'Comuni')?.publishedEServicesCount).toStrictEqual(2)
    expect(
      result.find((a) => a.name === 'Aziende Ospedaliere')?.publishedEServicesCount
    ).toStrictEqual(1)
  })

  it('getTop10MostSubscribedEServicesMetric', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ id: 'eservice-1', name: 'eservice-1', producerId: 'producer-1' }) },
      { data: getEServiceMock({ id: 'eservice-2', name: 'eservice-2', producerId: 'producer-1' }) },
      { data: getEServiceMock({ id: 'eservice-3', name: 'eservice-3', producerId: 'producer-1' }) },
      { data: getEServiceMock({ id: 'eservice-4', name: 'eservice-4', producerId: 'producer-1' }) },
    ])

    await seedCollection('agreements', [
      ...Array.from({ length: 3 }, (_) => ({
        data: getAgreementMock({ eserviceId: 'eservice-1' }),
      })),
      ...Array.from({ length: 2 }, (_) => ({
        data: getAgreementMock({ eserviceId: 'eservice-2' }),
      })),
      ...Array.from({ length: 1 }, (_) => ({
        data: getAgreementMock({ eserviceId: 'eservice-3' }),
      })),
      ...Array.from({ length: 4 }, (_) => ({
        data: getAgreementMock({ eserviceId: 'eservice-4' }),
      })),
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer-1',
          name: 'Producer 1',
        }),
      },
    ])

    const result = await metricsManager.getTop10MostSubscribedEServicesMetric()

    expect(result[0].activeAgreements).toStrictEqual(4)
    expect(result[0].name).toStrictEqual('eservice-4')
    expect(result[0].producerName).toStrictEqual('Producer 1')

    expect(result[1].activeAgreements).toStrictEqual(3)
    expect(result[1].name).toStrictEqual('eservice-1')
    expect(result[1].producerName).toStrictEqual('Producer 1')

    expect(result[2].activeAgreements).toStrictEqual(2)
    expect(result[2].name).toStrictEqual('eservice-2')
    expect(result[2].producerName).toStrictEqual('Producer 1')

    expect(result[3].activeAgreements).toStrictEqual(1)
    expect(result[3].name).toStrictEqual('eservice-3')
    expect(result[3].producerName).toStrictEqual('Producer 1')
  })
})
