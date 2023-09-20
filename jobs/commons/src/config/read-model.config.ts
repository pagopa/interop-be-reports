export interface ReadModelConfig {
  mongodbReplicaSet?: string,
  mongodbDirectConnection?: boolean,
  mongodbReadPreference?: string,
  mongodbRetryWrites?: boolean,

  readModelDbUser: string,
  readModelDbPassword: string,
  readModelDbHost: string,
  readModelDbPort: string,
  readModelDbName: string,
}