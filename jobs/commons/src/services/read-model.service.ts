import { Collection, Db, MongoClient, MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { ATTRIBUTES_COLLECTION_NAME, Attribute, ESERVICES_COLLECTION_NAME, EService, PURPOSES_COLLECTION_NAME, Purpose, ReadModelConfig, TENANTS_COLLECTION_NAME, Tenant } from '../index.js'

export class ReadModelClient {

  eservices: Collection<{ data: EService }>
  tenants: Collection<{ data: Tenant }>
  purposes: Collection<{ data: Purpose }>
  attributes: Collection<{ data: Attribute }>

  private constructor(private mongodbClient: MongoClient, db: Db) {
    this.mongodbClient = mongodbClient

    this.attributes = db.collection(ATTRIBUTES_COLLECTION_NAME)
    this.eservices = db.collection(ESERVICES_COLLECTION_NAME)
    this.tenants = db.collection(TENANTS_COLLECTION_NAME)
    this.purposes = db.collection(PURPOSES_COLLECTION_NAME)
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
