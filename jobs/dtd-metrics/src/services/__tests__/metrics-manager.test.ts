import { MongoMemoryServer } from 'mongodb-memory-server'
import { MetricsManager } from '../metrics-manager.js'
import {
  ReadModelClient,
  getAgreementMock,
  getAttributeMock,
  getEServiceMock,
  getTenantMock,
} from '@interop-be-reports/commons'
import { MACRO_CATEGORIES } from '../../configs/macro-categories.js'

type MacroCategoryName = (typeof MACRO_CATEGORIES)[number]['name']

describe('MetricsManager', () => {
  const DB_NAME = 'read-model'
  let readModel: ReadModelClient
  let mongoServer: MongoMemoryServer
  let metricsManager: MetricsManager

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: DB_NAME,
        auth: true,
      },
      auth: {
        customRootName: 'root',
        customRootPwd: 'root',
      },
    })

    readModel = await ReadModelClient.connect({
      readModelDbUser: mongoServer.auth?.customRootName as string,
      readModelDbPassword: mongoServer.auth?.customRootPwd as string,
      readModelDbHost: mongoServer.instanceInfo?.ip as string,
      readModelDbPort: mongoServer.instanceInfo?.port.toString() as string,
      readModelDbName: DB_NAME,
    })

    metricsManager = new MetricsManager(readModel)
  })

  afterEach(async () => {
    await readModel.eservices.deleteMany({})
    await readModel.agreements.deleteMany({})
    await readModel.attributes.deleteMany({})
    await readModel.purposes.deleteMany({})
    await readModel.tenants.deleteMany({})
  })

  afterAll(async () => {
    await readModel?.close()
    await mongoServer?.stop()
  })

  async function seedCollection(
    collection: 'eservices' | 'agreements' | 'tenants' | 'purposes' | 'attributes',
    data: Array<{ data: unknown }>
  ): Promise<void> {
    await readModel[collection].insertMany(data as never)
  }

  function repeatObjInArray<T extends Record<'data', unknown>>(item: T, length: number): T[] {
    return Array.from({ length }, () => ({ ...item }))
  }

  type MacroCategory = (typeof MACRO_CATEGORIES)[number]

  type MacroCategoryCodeFor<TName extends MacroCategory['name']> = Extract<
    MacroCategory,
    { name: TName }
  >['ipaCodes'][number]

  it('getPublishedEServicesMetric', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ descriptors: [{ state: 'Published' }] }) },
      { data: getEServiceMock({ descriptors: [{ state: 'Suspended' }, { state: 'Draft' }] }) },
      {
        data: getEServiceMock({ descriptors: [{ state: 'Suspended' }, { state: 'Deprecated' }] }),
      },
      { data: getEServiceMock({ descriptors: [{ state: 'Draft' }] }) },
    ])

    const result = await metricsManager.getPublishedEServicesMetric(undefined)
    expect(result.publishedEServicesCount).toStrictEqual(3)
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
          attributes: [{ id: 'attribute-altra-pub-amm-loc-1', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'altra-pub-amm-loc-2',
          attributes: [{ id: 'attribute-altra-pub-amm-loc-2', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-1',
          code: 'C16' satisfies MacroCategoryCodeFor<'Pubbliche Amministrazioni Centrali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-altra-pub-amm-loc-2',
          code: 'C1' satisfies MacroCategoryCodeFor<'Pubbliche Amministrazioni Centrali'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    const result = await metricsManager.getMacroCategoriesPublishedEServicesMetric()
    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Pubbliche Amministrazioni Centrali')
        ?.publishedEServicesCount
    ).toStrictEqual(2)

    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane')?.publishedEServicesCount
    ).toStrictEqual(2)
    expect(
      result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')?.publishedEServicesCount
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
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-1' }) }, 3),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-2' }) }, 2),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-3' }) }, 1),
      ...repeatObjInArray({ data: getAgreementMock({ eserviceId: 'eservice-4' }) }, 4),
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

    expect(result[0].agreementsCount).toStrictEqual(4)
    expect(result[0].name).toStrictEqual('eservice-4')
    expect(result[0].producerName).toStrictEqual('Producer 1')

    expect(result[1].agreementsCount).toStrictEqual(3)
    expect(result[1].name).toStrictEqual('eservice-1')
    expect(result[1].producerName).toStrictEqual('Producer 1')

    expect(result[2].agreementsCount).toStrictEqual(2)
    expect(result[2].name).toStrictEqual('eservice-2')
    expect(result[2].producerName).toStrictEqual('Producer 1')

    expect(result[3].agreementsCount).toStrictEqual(1)
    expect(result[3].name).toStrictEqual('eservice-3')
    expect(result[3].producerName).toStrictEqual('Producer 1')
  })

  it('getTop10MostSubscribedEServicesPerMacroCategoryMetric', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: 'eservice-1', producerId: 'producer' }) },
      { data: getEServiceMock({ name: 'eservice-2', id: 'eservice-2', producerId: 'producer' }) },
      { data: getEServiceMock({ name: 'eservice-3', id: 'eservice-3', producerId: 'producer' }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          consumerId: 'comune-1',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-2',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          consumerId: 'comune-3',
          producerId: 'producer',
          state: 'Draft',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-1',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-2',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          consumerId: 'azienda-ospedaliera-3',
          producerId: 'producer',
          state: 'Pending',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer',
          name: 'Producer',
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-1',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-2',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-3',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'comune-4',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-1',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-2',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera-3',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
        }),
      },
    ])

    const result = await metricsManager.getTop10MostSubscribedEServicesPerMacroCategoryMetric()
    const comuniTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(comuniTop10?.[0].name).toStrictEqual('eservice-3')
    expect(comuniTop10?.[0].producerName).toStrictEqual('Producer')
    expect(comuniTop10?.[0].agreementsCount).toStrictEqual(3)

    expect(comuniTop10?.[1].name).toStrictEqual('eservice-1')
    expect(comuniTop10?.[1].producerName).toStrictEqual('Producer')
    expect(comuniTop10?.[1].agreementsCount).toStrictEqual(1)

    const aziendeOspedaliereTop10 = result.find((a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL')
      ?.top10MostSubscribedEServices

    expect(aziendeOspedaliereTop10?.[0].name).toStrictEqual('eservice-3')
    expect(aziendeOspedaliereTop10?.[0].producerName).toStrictEqual('Producer')
    expect(aziendeOspedaliereTop10?.[0].agreementsCount).toStrictEqual(3)
  })

  it('getTop10ProviderWithMostSubscriberMetric', async () => {
    await seedCollection('eservices', [
      { data: getEServiceMock({ name: 'eservice-1', id: 'eservice-1', producerId: 'producer-1' }) },
      { data: getEServiceMock({ name: 'eservice-2', id: 'eservice-2', producerId: 'producer-1' }) },
      { data: getEServiceMock({ name: 'eservice-3', id: 'eservice-3', producerId: 'producer-2' }) },
    ])

    await seedCollection('agreements', [
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          producerId: 'producer-1',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          producerId: 'producer-1',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          producerId: 'producer-2',
          consumerId: 'comune',
          certifiedAttributes: [{ id: 'attribute-comune' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-1',
          producerId: 'producer-1',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-2',
          producerId: 'producer-1',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
        }),
      },
      {
        data: getAgreementMock({
          eserviceId: 'eservice-3',
          producerId: 'producer-2',
          consumerId: 'azienda-ospedaliera',
          certifiedAttributes: [{ id: 'attribute-azienda-ospedaliera' }],
          state: 'Pending',
        }),
      },
    ])

    await seedCollection('tenants', [
      {
        data: getTenantMock({
          id: 'producer-1',
          name: 'Producer 1',
        }),
      },
      {
        data: getTenantMock({
          id: 'producer-2',
          name: 'Producer 2',
        }),
      },
      {
        data: getTenantMock({
          id: 'comune',
          attributes: [{ id: 'attribute-comune', type: 'PersistentCertifiedAttribute' }],
        }),
      },
      {
        data: getTenantMock({
          id: 'azienda-ospedaliera',
          attributes: [{ id: 'attribute-azienda-ospedaliera', type: 'PersistentCertifiedAttribute' }],
        }),
      },
    ])

    await seedCollection('attributes', [
      {
        data: getAttributeMock({
          id: 'attribute-comune',
          code: 'L18' satisfies MacroCategoryCodeFor<'Comuni e città metropolitane'>,
          kind: 'Certified',
        }),
      },
      {
        data: getAttributeMock({
          id: 'attribute-azienda-ospedaliera',
          code: 'L8' satisfies MacroCategoryCodeFor<'Aziende Ospedaliere e ASL'>,
          kind: 'Certified',
        }),
      },
    ])

    const result = await metricsManager.getTop10ProviderWithMostSubscriberMetric()

    const producer1 = result[0]
    expect(producer1.name).toStrictEqual('Producer 1')
    const producer1Comuni = producer1.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Comuni e città metropolitane'
    )
    const producer1AziendeOspedaliere = producer1.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )
    expect(producer1Comuni?.agreementsCount).toStrictEqual(2)
    expect(producer1AziendeOspedaliere?.agreementsCount).toStrictEqual(2)

    const producer2 = result[1]
    expect(producer2.name).toStrictEqual('Producer 2')
    const producer2Comuni = producer2.topSubscribers.find(
      (a) => a.name === 'Comuni e città metropolitane' //TODO: Fix typing
    )
    const producer2AziendeOspedaliere = producer2.topSubscribers.find(
      (a) => (a.name as MacroCategoryName) === 'Aziende Ospedaliere e ASL'
    )
    expect(producer2Comuni?.agreementsCount).toStrictEqual(1)
    expect(producer2AziendeOspedaliere?.agreementsCount).toStrictEqual(0)
  })
})
