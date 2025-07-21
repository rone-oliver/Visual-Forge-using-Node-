import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
  Global,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtMiddleware } from 'src/auth/middleware/jwt.middleware';

@Global()
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
            expiresIn:
              configService.get<string>('ACCESS_TOKEN_EXPIRATION') || '15m',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [],
  controllers: [],
  exports: [JwtModule],
})
export class CoreModule implements NestModule {
  constructor(private configService: ConfigService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        { path: 'auth/user/login', method: RequestMethod.POST },
        { path: 'auth/user/register', method: RequestMethod.POST },
        { path: 'auth/user/verify-email', method: RequestMethod.POST },
        { path: 'auth/user/forgot-password', method: RequestMethod.POST },
        { path: 'auth/user/verify-reset-otp', method: RequestMethod.POST },
        { path: 'auth/user/reset-password', method: RequestMethod.POST },
        { path: 'auth/user/resend-otp', method: RequestMethod.POST },
        { path: 'auth/admin/login', method: RequestMethod.POST },
        { path: 'auth/logout', method: RequestMethod.DELETE },
        { path: 'auth/refresh', method: RequestMethod.GET },
        { path: 'auth/google', method: RequestMethod.POST },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL }); // Apply to all routes
  }
}
