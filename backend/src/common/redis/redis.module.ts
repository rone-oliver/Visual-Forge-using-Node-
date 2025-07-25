import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisProvider } from './redis.provider';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [redisProvider, RedisService],
  imports: [ConfigModule],
  exports: [RedisService],
})
export class RedisModule {}
