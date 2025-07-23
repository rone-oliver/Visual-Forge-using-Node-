import { HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { User } from "../models/user.schema";
import { FileUploadResultDto, UpdateProfileDto, UserBaseResponseDto, UserBasicInfoDto, UserProfileResponseDto } from "../dto/users.dto";
import { Types } from "mongoose";
import { UserInfoForChatListDto } from "../interfaces/services/users.service.interface";
import { ICloudinaryService, ICloudinaryServiceToken } from "src/common/cloudinary/interfaces/cloudinary-service.interface";
import { IHashingService, IHashingServiceToken } from "src/common/hashing/interfaces/hashing.service.interface";
import { IUserRepository, IUserRepositoryToken } from "../interfaces/users.repository.interface";
import { IAdminWalletService, IAdminWalletServiceToken } from "src/wallet/interfaces/admin-wallet.service.interface";
import { IRelationshipService, IRelationshipServiceToken } from "src/common/relationship/interfaces/service.interface";
import { IEditorsService, IEditorsServiceToken } from "src/editors/interfaces/services/editors.service.interface";
import { IUserProfileService } from "../interfaces/services/user-profile.service.interface";

@Injectable()
export class UserProfileService implements IUserProfileService {
    private readonly _logger = new Logger(UserProfileService.name);

    constructor(
        @Inject(IUserRepositoryToken)
        private readonly _userRepository: IUserRepository,
        @Inject(ICloudinaryServiceToken)
        private readonly _cloudinaryService: ICloudinaryService,
        @Inject(IHashingServiceToken)
        private readonly _hashingService: IHashingService,
        @Inject(IAdminWalletServiceToken)
        private readonly _adminWalletService: IAdminWalletService,
        @Inject(IRelationshipServiceToken)
        private readonly _relationshipService: IRelationshipService,
        @Inject(IEditorsServiceToken)
        private readonly _editorService: IEditorsService,
    ) { }

    async findOne(filter: Partial<User>): Promise<User | null> {
        try {
            return this._userRepository.findOne(filter);
        } catch (error) {
            this._logger.error(`Error finding user: ${error.message}`);
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }

    async findByUsername(username: string): Promise<User | null> {
        return this._userRepository.findOne({ username });
    }

    async findByEmail(email: string): Promise<User | null> {
        return this._userRepository.findOne({ email });
    }

    async createUser(user: Partial<User>): Promise<User> {
        try {
            if (user.password) {
                user.password = await this._hashingService.hash(user.password);
            }
            this._logger.log(`Creating new user: ${user.email}`);
            const newUser = await this._userRepository.create(user);
            await this._adminWalletService.creditWelcomeBonus(newUser._id.toString());
            return newUser;
        } catch (error) {
            this._logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    async createGoogleUser(user: Partial<User>): Promise<User> {
        try {
            const username = await this._generateUniqueUsername();
            const userData = { ...user, username, isVerified: true };
            return this._userRepository.create(userData);
        } catch (error) {
            this._logger.error(`Failed to create Google user: ${error.message}`);
            throw error;
        }
    }

    async updateUserGoogleId(
        userId: Types.ObjectId,
        googleId: string,
    ): Promise<User | null> {
        try {
            return await this._userRepository.findOneAndUpdate(
                { _id: userId },
                { $set: { googleId } },
            );
        } catch (error) {
            this._logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

    async updateOne(filter: Partial<User>, update: Partial<User>): Promise<User | null> {
        return this._userRepository.findOneAndUpdate(filter, update);
    }

    async updatePassword(
        userId: Types.ObjectId,
        password: string,
    ): Promise<boolean> {
        const hashedPassword = await this._hashingService.hash(password);
        const result = await this._userRepository.findOneAndUpdate(
            { _id: userId },
            { $set: { password: hashedPassword } },
        );
        return !!result;
    }

    async getUserDetails(
        userId: Types.ObjectId,
    ): Promise<UserProfileResponseDto | null> {
        try {
            this._logger.log(`Fetching user details for ID: ${userId}`);
            const user = await this._userRepository.findById(userId);
            if (user && user.isEditor) {
                const editorDetails = await this._editorService.findByUserId(user._id);
                if (editorDetails) {
                    this._logger.log('Editor details: ', editorDetails);

                    const [followersCount, followingCount] = await Promise.all([
                        this._relationshipService
                            .getFollowers({ userId: user._id, limit: 0, skip: 0 })
                            .then((f) => f.length),
                        this._relationshipService
                            .getFollowing({ userId: user._id, limit: 0, skip: 0 })
                            .then((f) => f.length),
                    ]);

                    return {
                        ...user.toObject(),
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            tipsAndTricks: editorDetails.tipsAndTricks || '',
                            sharedTutorials: editorDetails.sharedTutorials || [],
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this._calculateAverageRating(
                                editorDetails.ratings,
                            ),
                            socialLinks: editorDetails.socialLinks || {},
                            warningCount: editorDetails.warningCount || 0,
                            createdAt: editorDetails.createdAt,
                            followersCount,
                            followingCount,
                        },
                    };
                } else console.log('no editor details');
            }
            return user;
        } catch (error) {
            this._logger.error(`Error fetching user details: ${error.message}`);
            throw error;
        }
    }

    async getUsers(currentUserId: Types.ObjectId): Promise<UserBasicInfoDto[]> {
        try {
            const { items } = await this._userRepository.find({
                _id: { $ne: currentUserId },
            });
            return items;
        } catch (error) {
            this._logger.error(`Error fetching users: ${error.message}`);
            throw error;
        }
    }

    async getUser(userId: Types.ObjectId): Promise<UserBasicInfoDto | null> {
        try {
            const user = await this._userRepository.findById(userId);
            if (!user) {
                throw new NotFoundException('No user info found for your chats');
            }
            return user;
        } catch (error) {
            this._logger.error(`Error fetching user: ${error.message}`);
            throw error;
        }
    }

    async isExistingUser(userId: Types.ObjectId): Promise<boolean> {
        return this._userRepository.exists({ _id: userId });
    }

    async getUserInfoForChatList(
        userId: Types.ObjectId,
    ): Promise<UserInfoForChatListDto> {
        try {
            const userInfo = await this._userRepository.findById(userId, {
                username: 1,
                profileImage: 1,
                isOnline: 1,
            });
            if (!userInfo) {
                throw new NotFoundException('No user info found for your chats');
            }
            return userInfo;
        } catch (error) {
            this._logger.error(
                `Error fetching user info for chat list: ${error.message}`,
            );
            throw error;
        }
    }

    async updateProfileImage(
        userId: Types.ObjectId,
        profileImageUrl: string,
    ): Promise<UserBaseResponseDto | null> {
        try {
            return await this._userRepository.findOneAndUpdate(
                { _id: userId },
                { profileImage: profileImageUrl },
            );
        } catch (error) {
            this._logger.error(`Error updating profile image: ${error.message}`);
            throw error;
        }
    }

    async updateProfile(
        userId: Types.ObjectId,
        updateProfileDto: UpdateProfileDto,
    ): Promise<UserProfileResponseDto | null> {
        try {
            return await this._userRepository.findOneAndUpdate(
                { _id: userId },
                { $set: updateProfileDto },
            );
        } catch (error) {
            this._logger.error(`Error updating profile: ${error.message}`);
            throw error;
        }
    }

    private _calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    private async _generateUniqueUsername(): Promise<string> {
        let username = '';
        let isUnique = false;
        while (!isUnique) {
            username = `user_${Math.random().toString(36).substring(2, 9)}`;
            const existingUser = await this.findByUsername(username);
            if (!existingUser) {
                isUnique = true;
            }
        }
        return username;
    }
}