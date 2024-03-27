import { Consumer, EachMessagePayload, Kafka, logLevel } from "kafkajs";
import { Env } from "../config/env.js";
import { SimpleKafkaLogCreator } from "./simpleKafkaLogger.js";


export async function initConsumer(env: Env): Promise<Consumer> {

  const kafka = new Kafka({
    clientId: env.KAFKA_CLIENT_ID,
    brokers: env.SELFCARE_BROKER_URLS,
    ssl: true,
    sasl: {
      mechanism: 'plain',
      username: '$ConnectionString',
      password: env.BROKER_CONNECTION_STRING
    },
    logLevel: logLevel.INFO,
    logCreator: SimpleKafkaLogCreator
  })

  const consumer = kafka.consumer({ groupId: env.KAFKA_GROUP_ID })

  if (env.RESET_CONSUMER_OFFSETS)
    await resetPartitionsOffsets(env, kafka, consumer)

  function exitGracefully(): void {
    consumer.disconnect().finally(() => {
      console.log("Consumer disconnected");
      process.exit(0);
    });
  }

  process.on("SIGINT", exitGracefully);
  process.on("SIGTERM", exitGracefully);

  await consumer.connect();

  await consumer.subscribe({ topic: env.TOPIC_NAME, fromBeginning: true });

  return consumer;
}


export function exitWithError(consumer: Consumer, error: unknown): void {
  consumer.disconnect().finally(() => {
    console.log(`Consumer interrupted after error: ${error}`);
    process.exit(1);
  });
}

async function resetPartitionsOffsets(env: Env, kafka: Kafka, consumer: Consumer): Promise<void> {
  const admin = kafka.admin()

  await admin.connect()

  const topics = await admin.fetchTopicMetadata({ topics: [env.TOPIC_NAME] })
  topics.topics.flatMap(t => t.partitions).map(p => consumer.seek({ topic: env.TOPIC_NAME, partition: p.partitionId, offset: "-2" }))
  await admin.disconnect()
}

export const commitMessageOffsets = async (
  consumer: Consumer,
  payload: EachMessagePayload
): Promise<void> => {
  const { topic, partition, message } = payload;
  await consumer.commitOffsets([
    { topic, partition, offset: (Number(message.offset) + 1).toString() },
  ]);
};