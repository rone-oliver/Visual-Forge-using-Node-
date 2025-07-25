import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { redisProvider } from './redis.provider';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [redisProvider, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
