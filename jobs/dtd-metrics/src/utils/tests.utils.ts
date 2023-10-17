import { ReadModelClient } from '@interop-be-reports/commons'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MACRO_CATEGORIES } from '../configs/macro-categories.js'

const DB_NAME = 'read-model'
let readModelMock: ReadModelClient
let mongoServer: MongoMemoryServer

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

  readModelMock = await ReadModelClient.connect({
    readModelDbUser: mongoServer.auth?.customRootName as string,
    readModelDbPassword: mongoServer.auth?.customRootPwd as string,
    readModelDbHost: mongoServer.instanceInfo?.ip as string,
    readModelDbPort: mongoServer.instanceInfo?.port.toString() as string,
    readModelDbName: DB_NAME,
  })
})

afterEach(async () => {
  await readModelMock.eservices.deleteMany({})
  await readModelMock.agreements.deleteMany({})
  await readModelMock.attributes.deleteMany({})
  await readModelMock.purposes.deleteMany({})
  await readModelMock.tenants.deleteMany({})
})

afterAll(async () => {
  await readModelMock?.close()
  await mongoServer?.stop()
})

async function seedCollection(
  collection: 'eservices' | 'agreements' | 'tenants' | 'purposes' | 'attributes',
  data: Array<{ data: unknown }>
): Promise<void> {
  await readModelMock[collection].insertMany(data as never)
}

function repeatObjInArray<T extends Record<'data', unknown>>(item: T, length: number): T[] {
  return Array.from({ length }, () => ({ ...item }))
}

type MacroCategoryName = (typeof MACRO_CATEGORIES)[number]['name']
type MacroCategory = (typeof MACRO_CATEGORIES)[number]
type MacroCategoryCodeFor<TName extends MacroCategory['name']> = Extract<
  MacroCategory,
  { name: TName }
>['ipaCodes'][number]

export { readModelMock, seedCollection, repeatObjInArray, MacroCategory, MacroCategoryName, MacroCategoryCodeFor }
