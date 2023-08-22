import { Consumer, Kafka } from "kafkajs";
import { Env } from "../config/env.js";


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
  })

  const consumer = kafka.consumer({ groupId: env.KAFKA_GROUP_ID })

  function exitGracefully(): void {
    consumer.disconnect().finally(() => {
      console.log("Consumer disconnected");
      process.exit(0);
    });
  }

  process.on("SIGINT", exitGracefully);
  process.on("SIGTERM", exitGracefully);

  await consumer.connect();

  await consumer.subscribe({ topic: env.TOPIC_NAME, fromBeginning: true }); // TODO Evaluate the use of fromBeginning

  return consumer;
}


export function exitWithError(consumer: Consumer, error: unknown): void {
  consumer.disconnect().finally(() => {
    console.log(`Consumer interrupted after error: ${error}`);
    process.exit(1);
  });
}