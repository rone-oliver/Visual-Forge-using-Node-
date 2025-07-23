import { Types } from 'mongoose';
import {
    UpdateProfileDto,
    UserBaseResponseDto,
    UserBasicInfoDto,
    UserProfileResponseDto,
} from '../../dto/users.dto';
import { User } from '../../models/user.schema';
import { UserInfoForChatListDto } from './users.service.interface';

export const IUserProfileServiceToken = Symbol('IUserProfileService');

export interface IUserProfileService {
    findOne(filter: Partial<User>): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    createUser(user: Partial<User>): Promise<User>;
    createGoogleUser(user: Partial<User>): Promise<User>;
    updateUserGoogleId(
        userId: Types.ObjectId,
        googleId: string,
    ): Promise<User | null>;
    updateOne(filter: Partial<User>, update: Partial<User>): Promise<User | null>;
    updatePassword(userId: Types.ObjectId, password: string): Promise<boolean>;
    getUserDetails(
        userId: Types.ObjectId,
    ): Promise<UserProfileResponseDto | null>;
    getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]>;
    getUserInfoForChatList(
        userId: Types.ObjectId,
    ): Promise<UserInfoForChatListDto>;
    updateProfileImage(
        userId: Types.ObjectId,
        profileImageUrl: string,
    ): Promise<UserBaseResponseDto | null>;
    updateProfile(
        userId: Types.ObjectId,
        updateProfileDto: UpdateProfileDto,
    ): Promise<UserProfileResponseDto | null>;
    getUser(
        userId: Types.ObjectId,
    ): Promise<UserBasicInfoDto | null>;
    isExistingUser(userId: Types.ObjectId): Promise<boolean>;
}