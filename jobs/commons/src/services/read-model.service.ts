import { Db, MongoClient, MongoClientOptions, ReadPreferenceMode } from 'mongodb'
import { ReadModelConfig } from '../index.js'

export class ReadModelClient {
  private mongodbClient: MongoClient
  private database: Db

  private constructor(mongodbClient: MongoClient, db: Db) {
    this.mongodbClient = mongodbClient
    this.database = db
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

  db() {
    return this.database
  }

  /**
   * Closes the connection to the database
   * */
  async close() {
    await this.mongodbClient.close()
  }
}
