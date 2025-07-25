import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';
import { REDIS_CLIENT_TOKEN } from './redis.provider';

@Injectable()
export class RedisService {
    constructor(
        @Inject(REDIS_CLIENT_TOKEN)
        private readonly _redisClient: RedisClientType,
    ) { }

    get client(): RedisClientType {
        return this._redisClient;
    }
}
