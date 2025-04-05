import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Response } from 'express';
import { Model, Types } from 'mongoose';
import { Preference, PreferenceDocument } from 'src/common/models/userPreference.schema';

@Injectable()
export class CommonService {
  constructor(
    @InjectModel(Preference.name) private preferenceModel: Model<PreferenceDocument>
  ){};
  logoutHandler(response: Response, userType: 'User' | 'Admin') {
    const tokenName = userType.toLowerCase();
    try {
      response.clearCookie(`${tokenName}RefreshToken`, {
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

  async updateThemePreference(res: Response,userId:Types.ObjectId, userType: 'User' | 'Admin', isDark: boolean): Promise<void> {
    // const userId = this.getUserIdFromRequest(res, userType); // Implement this method
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized or User ID not found' });
      return;
    }

    const theme = isDark ? 'dark' : 'light';
    const existingPreference = await this.preferenceModel.findOne({ userId });

    if (existingPreference) {
      await this.preferenceModel.updateOne(
        { _id: existingPreference._id },
        { $set: { 'preferences.theme': theme } }
      );
      res.status(200).json({ message: 'Theme preference updated'});
    } else {
      this.preferenceModel.create({ userId, preferences:{theme}})
      res.status(201).json({ message: 'Theme preference created'});
    }
  }

  async getThemePreference(res: Response,userId:Types.ObjectId, userType: 'User' | 'Admin'): Promise<void> {
    // const userId = this.getUserIdFromRequest(res, userType); // Implement this method
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized or User ID not found' });
      return;
    }

    const preference = await this.preferenceModel.findOne({ userId });
    if (preference && preference.preferences && preference.preferences.theme) {
      res.status(200).json({ isDark:preference.preferences.theme === 'dark' ? true : false });
    } else {
      res.status(404).json({ message: 'No theme preference found' });
    }
  }

  // private getUserIdFromRequest(res: Response, userType: 'User' | 'Admin'): string | null {
  //   // Assuming your authentication middleware adds user information to the request
  //   const user = (res.req as any).user; // You might need to adjust the type
  //   if (user) {
  //     return user.userId; // Or user._id depending on your user object structure
  //   }
  //   return null;
  // }
}
