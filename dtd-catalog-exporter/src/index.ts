import {
  connectToDatabase,
  getEServicesAttributes,
  getEServices,
  getEServicesTenants,
} from "./controllers/database.js";
import {
  getAllAttributesIdsInEServices,
  getAllTenantsIdsInEServices,
  getExecutionTime,
  getMappedRecords,
} from "./utils.js";
import { publicEServicesSchema } from "./models/PublicEService.js";
import chalk from "chalk";
import { uploadJSONToS3Bucket } from "./controllers/aws-s3.js";
import { remapEServiceToPublicEService } from "./controllers/e-service-remapper.js";

const log = console.log;

async function main() {
  const startTime = process.hrtime();

  log("Connecting to database...");
  const client = await connectToDatabase();
  log(chalk.green("Connected to database!\n"));

  log("Fetching e-services from database...");
  const eservices = await getEServices(client);

  log("Fetching e-service's tenants and attributes data from database...");
  const eserviceAttributeIds = getAllAttributesIdsInEServices(eservices);
  const tenantIds = getAllTenantsIdsInEServices(eservices);

  const attributes = await getEServicesAttributes(client, eserviceAttributeIds);
  const tenants = await getEServicesTenants(client, tenantIds);

  log(chalk.green("Data successfully fetched!\n"));

  log("Remapping e-services to public e-services...\n");
  const attributesMap = getMappedRecords(attributes);
  const tenantsMap = getMappedRecords(tenants);
  const publicEServices = eservices.map((eservice) => {
    log(`Remapping ${chalk.blueBright(eservice.name)} - ${chalk.yellow(eservice.id)} ...`);
    return remapEServiceToPublicEService(eservice, attributesMap, tenantsMap);
  });

  log("\nRemapping completed! Validating result...");
  publicEServicesSchema.parse(publicEServices);

  log("\nUploading result to S3 bucket...");
  await uploadJSONToS3Bucket(publicEServices);

  await client.close();
  log(chalk.green(`\nDone! Execution time: ${getExecutionTime(startTime)}\n`));
  process.exit(0);
}

main();
