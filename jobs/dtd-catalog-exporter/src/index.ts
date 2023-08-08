import {
  MongoDBEServiceClient,
  uploadJSONToS3Bucket,
  remapEServiceToPublicEService,
} from './services/index.js'
import {
  getAllAttributesIdsInEServicesActiveDescriptors,
  getAllTenantsIdsInEServices,
  getExecutionTime,
  getMappedRecords,
} from './utils/index.js'
import { publicEServicesSchema } from './models/index.js'

const log = console.log

async function main() {
  const startTime = process.hrtime()

  log('Connecting to database...')
  const mongoDBEServiceClient = await MongoDBEServiceClient.connect()
  log('Connected to database!\n')

  log('Fetching e-services from database...')
  const eservices = await mongoDBEServiceClient.getEServices()

  log("Fetching e-service's tenants and attributes data from database...")
  const eserviceAttributeIds = getAllAttributesIdsInEServicesActiveDescriptors(eservices)
  const tenantIds = getAllTenantsIdsInEServices(eservices)

  const attributes = await mongoDBEServiceClient.getEServicesAttributes(eserviceAttributeIds)
  const tenants = await mongoDBEServiceClient.getEServicesTenants(tenantIds)

  log('Data successfully fetched!\n')

  log('Remapping e-services to public e-services...\n')
  const attributesMap = getMappedRecords(attributes)
  const tenantsMap = getMappedRecords(tenants)
  const publicEServices = eservices.map((eservice) => {
    log(`Remapping ${eservice.name} - ${eservice.id} ...`)
    return remapEServiceToPublicEService(eservice, attributesMap, tenantsMap)
  })

  log('\nRemapping completed! Validating result...')
  publicEServicesSchema.parse(publicEServices)

  log('\nUploading result to S3 bucket...')
  await uploadJSONToS3Bucket(publicEServices)

  await mongoDBEServiceClient.close()
  log(`\nDone! Execution time: ${getExecutionTime(startTime)}\n`)
  process.exit(0)
}

main()
