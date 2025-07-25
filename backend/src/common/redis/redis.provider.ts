import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

export const REDIS_CLIENT_TOKEN = Symbol('REDIS_CLIENT');

export const redisProvider = {
  provide: REDIS_CLIENT_TOKEN,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger('Redis');
    const client = createClient({
      username: 'default',
      password: configService.getOrThrow<string>('REDIS_PASSWORD'),
      socket: {
        host: configService.getOrThrow<string>('REDIS_HOST'),
        port: +configService.getOrThrow<string>('REDIS_PORT'),
      },
    });

    client.on('error', (err) => logger.error('Redis Client Error', err));
    client.on('connect', () => logger.log('Connecting to Redis...'));
    client.on('ready', () => logger.log('✅ Successfully connected to Redis'));
    client.on('end', () => logger.warn('Redis disconnected'));

    try {
      await client.connect();
    } catch (err) {
      logger.error(`Failed to connect to Redis: ${err.message}`);
      throw err;
    }

    return client;
  },
};
