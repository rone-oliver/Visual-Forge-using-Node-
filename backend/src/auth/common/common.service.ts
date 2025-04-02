import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class CommonService {
    logoutHandler(response: Response){
        try {
            response.clearCookie('refreshToken', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            console.log('logout controller called');
            response.status(200).json({ message: 'Successfully logged out' });
          } catch (error) {
            console.error('Logout error:', error);
            response.status(500).json({ message: 'Logout failed' });
          }
    }
}
