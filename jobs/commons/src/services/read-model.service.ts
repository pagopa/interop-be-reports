import { Collection, Db, MongoClient, MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { ATTRIBUTES_COLLECTION_NAME, Attribute, ESERVICES_COLLECTION_NAME, EService, PURPOSES_COLLECTION_NAME, Purpose, ReadModelConfig, TENANTS_COLLECTION_NAME, Tenant } from '../index.js'

export class ReadModelClient {
  private mongodbClient: MongoClient

  eservices: Collection<{ data: EService }>
  tenants: Collection<{ data: Tenant }>
  purposes: Collection<{ data: Purpose }>
  attributes: Collection<{ data: Attribute }>

  private constructor(mongodbClient: MongoClient, db: Db) {
    this.mongodbClient = mongodbClient

    this.attributes = db.collection<{ data: Attribute }>(ATTRIBUTES_COLLECTION_NAME)
    this.eservices = db.collection<{ data: EService }>(ESERVICES_COLLECTION_NAME)
    this.tenants = db.collection<{ data: Tenant }>(TENANTS_COLLECTION_NAME)
    this.purposes = db.collection<{ data: Purpose }>(PURPOSES_COLLECTION_NAME)
  }

  /**
   * Connects to the mongodb database
   */
  public static async connect(config: ReadModelConfig) {
    const connectionConfig = {
      replicaSet: config.mongodbReplicaSet,
      directConnection: config.mongodbDirectConnection,
      readPreference: config.mongodbReadPreference as ReadPreferenceMode,
      retryWrites: config.mongodbRetryWrites,
    } satisfies MongoClientOptions

    const connectionString = `mongodb://${config.readModelDbUser}:${config.readModelDbPassword}@${config.readModelDbHost}:${config.readModelDbPort}`
    const mongodBClient = await new MongoClient(connectionString, connectionConfig).connect()
    return new ReadModelClient(mongodBClient, mongodBClient.db(config.readModelDbName))
  }

  /**
   * Closes the connection to the database
   * */
  async close() {
    await this.mongodbClient.close()
  }
}
