import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, Admin } from 'kafkajs';
import { Socket } from 'node:net';

export const TOPIC_WEATHER_SYNC = 'mausamnet.weather.sync';
export const TOPIC_WEATHER_SNAPSHOT = 'mausamnet.weather.snapshot';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  private readonly enabled: boolean;
  private readonly brokers: string[];
  private readonly clientId: string;
  private readonly autocreate: boolean;

  private kafka: Kafka | null = null;
  private producer: Producer | null = null;
  private admin: Admin | null = null;
  private readonly consumers = new Map<string, Consumer>();

  private readonly readyPromise: Promise<void>;
  private resolveReady!: () => void;

  constructor(private readonly config: ConfigService) {
    this.brokers = (this.config.get<string>('KAFKA_BROKERS') ?? 'localhost:9092')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    this.clientId =
      this.config.get<string>('KAFKA_CLIENT_ID') ?? 'mausamnet-api';
    this.autocreate =
      (this.config.get<string>('KAFKA_TOPIC_AUTOCREATE') ?? 'true') !== 'false';
    const flag = this.config.get<string>('KAFKA_ENABLED') ?? 'false';
    this.enabled = flag === 'true' && this.brokers.length > 0;
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
  }

  /**
   * Resolves once this service's own onModuleInit has run to completion. Nest
   * invokes onModuleInit hooks concurrently across providers, so dependents
   * cannot rely on call order — they must await this instead.
   */
  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  isEnabled(): boolean {
    return this.enabled && this.kafka !== null;
  }

  getTopic(name: 'sync' | 'snapshot'): string {
    return name === 'sync'
      ? this.config.get<string>('KAFKA_TOPIC_WEATHER_SYNC') ?? TOPIC_WEATHER_SYNC
      : this.config.get<string>('KAFKA_TOPIC_WEATHER_SNAPSHOT') ?? TOPIC_WEATHER_SNAPSHOT;
  }

  async onModuleInit() {
    try {
      if (!this.enabled) {
        this.logger.log('Kafka disabled; sync will run in-process');
        return;
      }
      // Probe the broker with a raw TCP connect before touching kafkajs: a down
      // broker must degrade to in-process sync cleanly. kafkajs itself leaves an
      // unhandled internal rejection when connect() fails, which would kill the
      // process during Nest startup.
      if (!(await this.brokerReachable())) {
        this.logger.warn(
          `Kafka broker(s) not reachable (${this.brokers.join(',')}); falling back to in-process sync`,
        );
        this.kafka = null;
        return;
      }
      this.kafka = new Kafka({
        clientId: this.clientId,
        brokers: this.brokers,
        retry: { retries: 3 },
      });
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.admin = this.kafka.admin();
      if (this.autocreate) {
        const topics = [this.getTopic('sync'), this.getTopic('snapshot')];
        await this.admin.createTopics({
          topics: topics.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });
      }
      this.logger.log(
        `Kafka connected (brokers: ${this.brokers.join(',')}, client: ${this.clientId})`,
      );
    } catch (err) {
      this.logger.error(`Kafka init failed: ${String(err)}`);
      this.kafka = null;
      this.producer = null;
      this.admin = null;
    } finally {
      this.resolveReady();
    }
  }

  private brokerReachable(timeoutMs = 2000): Promise<boolean> {
    if (this.brokers.length === 0) return Promise.resolve(false);
    const [host, portRaw = '9092'] = this.brokers[0].split(':');
    const port = Number(portRaw) || 9092;
    return new Promise((resolve) => {
      const socket = new Socket();
      const done = (ok: boolean) => {
        socket.destroy();
        resolve(ok);
      };
      socket.setTimeout(timeoutMs);
      socket.once('connect', () => done(true));
      socket.once('timeout', () => done(false));
      socket.once('error', () => done(false));
      socket.connect({ host, port });
    });
  }

  async publish(topic: string, message: unknown, key?: string): Promise<void> {
    if (!this.isEnabled() || !this.producer) return;
    await this.producer.send({
      topic,
      messages: [
        {
          ...(key ? { key } : {}),
          value: JSON.stringify(message),
        },
      ],
    });
  }

  async consume(
    topic: string,
    groupId: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<void> {
    if (!this.isEnabled() || !this.kafka) return;
    const consumer: Consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (message.value == null) return;
        try {
          await handler(JSON.parse(message.value.toString()));
        } catch (err) {
          this.logger.error(
            `[${topic}] handler failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      },
    });
    this.consumers.set(topic, consumer);
    this.logger.log(`Kafka consumer listening on ${topic} (group ${groupId})`);
  }

  async onModuleDestroy() {
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect().catch(() => undefined);
    }
    await this.producer?.disconnect().catch(() => undefined);
    await this.admin?.disconnect().catch(() => undefined);
  }
}