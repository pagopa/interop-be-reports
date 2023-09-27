import { ReadModelClient } from '@interop-be-reports/commons'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { MACRO_CATEGORIES } from '../../configs/macro-categories.js'

const DB_NAME = 'read-model'
let readModel: ReadModelClient
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

  readModel = await ReadModelClient.connect({
    readModelDbUser: mongoServer.auth?.customRootName as string,
    readModelDbPassword: mongoServer.auth?.customRootPwd as string,
    readModelDbHost: mongoServer.instanceInfo?.ip as string,
    readModelDbPort: mongoServer.instanceInfo?.port.toString() as string,
    readModelDbName: DB_NAME,
  })
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

type MacroCategoryName = (typeof MACRO_CATEGORIES)[number]['name']
type MacroCategory = (typeof MACRO_CATEGORIES)[number]
type MacroCategoryCodeFor<TName extends MacroCategory['name']> = Extract<
  MacroCategory,
  { name: TName }
>['ipaCodes'][number]

export { readModel, seedCollection, repeatObjInArray, MacroCategory, MacroCategoryName, MacroCategoryCodeFor }
