import chalk from 'chalk'
import { AwsS3Client, DynamoDbTableClient, OneTrustClient, html2json } from './services/index.js'
import { env, ONE_TRUST_NOTICES } from './config/index.js'
import { OneTrustNoticeDBSchema } from './models/index.js'
import {
  checkForNewVersion,
  getBucketPath,
  getNoticeContent,
  remapOneTrustNoticeVersionToDynamoDBSchemaUpdateObject,
  resolveError,
} from './utils/index.js'

const log = console.log

async function main() {
  const awsS3Client = new AwsS3Client()
  const dynamoDbTableClient = new DynamoDbTableClient<OneTrustNoticeDBSchema>(
    env.PRIVACY_NOTICES_DYNAMO_TABLE_NAME
  )

  log('Program started.\n')
  log('> Connecting to OneTrust...')
  const oneTrustClient = await OneTrustClient.connect()

  log(chalk.green('Connected!\n'))

  for (const oneTrustNotice of ONE_TRUST_NOTICES) {
    try {
      log(`> Getting ${chalk.blue(oneTrustNotice.name)} data...`)

      const [noticeActiveVersion, ...localizedNoticeContentResponses] = await Promise.all([
        // Get the active version of the notice...
        oneTrustClient.getNoticeActiveVersion(oneTrustNotice.id),
        // ... and the localized content for each language.
        ...env.LANGS.map((lang) => {
          return oneTrustClient.getNoticeContent(oneTrustNotice.id, lang)
        }),
      ])

      // Extracts the notice content for each language.
      const noticeContents = localizedNoticeContentResponses.map(getNoticeContent)

      // Generate the bucket paths for each language.
      const bucketPaths = noticeContents.map((noticeContent, index) =>
        getBucketPath(env.LANGS[index], noticeContent)
      )

      log('> Checking if it is a new version...')

      const isNewVersion = (
        await Promise.all(
          bucketPaths.map((bucketPath) => checkForNewVersion(awsS3Client, bucketPath))
        )
      ).some(Boolean)

      if (isNewVersion) {
        log(`> New version found! Uploading to ${chalk.blue(env.HISTORY_STORAGE_BUCKET)} bucket...`)
        await Promise.all(
          localizedNoticeContentResponses.map((noticeContentResponse, index) =>
            awsS3Client.uploadJSONToS3Bucket(
              env.HISTORY_STORAGE_BUCKET,
              noticeContentResponse,
              bucketPaths[index]
            )
          )
        )
      } else {
        log(chalk.yellow('No new version found.'))
      }

      log(`> Uploading notice content to ${chalk.blue(env.CONTENT_STORAGE_BUCKET)} bucket...`)

      const jsonHtmlNodes = noticeContents.map(({ content }) => html2json(content))
      await Promise.all(
        jsonHtmlNodes.map((jsonHtmlNode, index) =>
          awsS3Client.uploadJSONToS3Bucket(
            env.CONTENT_STORAGE_BUCKET,
            jsonHtmlNode,
            bucketPaths[index]
          )
        )
      )

      log(`> Updating ${chalk.blue(oneTrustNotice.name)} data in DynamoDB...`)

      await dynamoDbTableClient.updateItem(
        { privacyNoticeId: oneTrustNotice.id },
        remapOneTrustNoticeVersionToDynamoDBSchemaUpdateObject(noticeActiveVersion)
      )

      log(chalk.green(`Finished ${chalk.blue(oneTrustNotice.name)}!\n`))
    } catch (error) {
      log(chalk.red(`Error while processing ${chalk.blue(oneTrustNotice.name)}:`))
      log(chalk.red(resolveError(error)))
      log(chalk.red(`\n> Deleting ${chalk.blue(oneTrustNotice.name)} data from DynamoDB...\n`))
      // If an error occurs, delete the notice from the database.
      await dynamoDbTableClient.deleteItem({ privacyNoticeId: oneTrustNotice.id })
    }
  }

  log('End of program.')
}

main()
