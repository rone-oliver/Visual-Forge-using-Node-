import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const authToken = client.handshake.auth.token?.split(' ')[1];
    this.logger.log(`Client ${client.id} connecting with token: ${authToken}`)

    if (!authToken) {
      this.logger.warn('Authentication token not provided. Disconnecting.');
      client.disconnect();
      return false;
    }

    try {
      const payload = await this.jwtService.verifyAsync(authToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      this.logger.log(`Client ${client.id} associated with user: ${payload.userId}`);
      client['user'] = { userId: payload.userId, role: payload.role, };
      return true;
    } catch (err) {
      this.logger.error('Authentication error:', err.message);
      client.disconnect();
      return false;
    }
  }
}
