import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenRefreshService } from 'src/auth/token-refresh/token-refresh.service';
import { TokenRefreshController } from 'src/auth/token-refresh/token-refresh.controller';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not defined');
        }
        return {
          secret: secret,
          signOptions: { 
            expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRATION') || '15m'
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [TokenRefreshService],
  controllers: [TokenRefreshController],
  exports: [JwtModule],
})
export class JwtConfigModule implements NestModule {
  constructor(private configService: ConfigService){};

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: 'auth/user/login', method: RequestMethod.POST },
        { path: 'auth/user/register', method: RequestMethod.POST },
        { path: 'auth/user/verify-email', method: RequestMethod.POST },
        { path: 'auth/admin/login', method: RequestMethod.POST },
        { path: 'auth/refresh', method: RequestMethod.GET },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
  }
}