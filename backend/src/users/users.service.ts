import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './models/user.schema';
import { Categories, EditorRequest, EditorRequestDocument } from 'src/common/models/editorRequest.schema';
import * as bcrypt from 'bcrypt';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
    ) { }

    async findOne(filter: Partial<User>): Promise<User | null> {
        try {
            this.logger.log(`Finding the user: ${filter.email}`);
            return this.userModel.findOne(filter).exec();
        } catch (error) {
            this.logger.error(`Error finding user: ${error.message}`);
            // throw error;
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }

    async findByUsername(username: string) {
        return await this.userModel.findOne({ username });
    }

    async findByEmail(email: string) {
        return await this.userModel.findOne({ email });
    }

    async createUser(user: Partial<User>): Promise<User> {
        try {
            if (user.password) {
                user.password = await bcrypt.hash(user.password, 10);
            }
            this.logger.log(`Creating new user: ${user.email}`);
            return this.userModel.create(user);
        } catch (error) {
            this.logger.error(`Error creating user: ${error.message}`);
            throw error;
        }
    }

    private async generateUniqueUsername(): Promise<string> {
        let isUnique = false;
        let username = '';

        while (!isUnique) {
            const randomString = Math.random().toString(36).substring(2, 6);
            username = `user_${randomString}`;

            const existingUser = await this.userModel.findOne({ username });
            if (!existingUser) {
                isUnique = true;
            }
        }
        return username;
    }

    async createGoogleUser(user: Partial<User>): Promise<User> {
        try {
            if (!user.username) {
                user.username = await this.generateUniqueUsername();
            }
            user.isVerified = true;
            return this.createUser(user);
        } catch (error) {
            this.logger.error(`Failed to create Google user: ${error.message}`);
            throw error;
        }
    }

    async updateUserGoogleId(userId: Types.ObjectId, googleId: string): Promise<User | null> {
        try {
            return await this.userModel.findOneAndUpdate({ _id: userId }, { $set: { googleId } }, { new: true })
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

    async updateOne(filter: Partial<User>, update: Partial<User>) {
        try {
            await this.userModel.updateOne(filter, update);
            this.logger.log("User data updated successfully");
        } catch (error) {
            this.logger.error(`Error updating User: ${error.message}`);
            throw error;
        }
    }

    async getUserDetails(userId: Types.ObjectId): Promise<User & { editorDetails?: any} | null> {
        try {
            this.logger.log(`Fetching user details for ID: ${userId}`);
            const user = await this.userModel.findById(userId);
            if(user && user.isEditor){
                this.logger.log('Fetching the editor details');
                console.log('user id: ', user._id);
                const editorDetails = await this.editorModel.findOne({userId: user._id}).lean();
                if(editorDetails){
                    this.logger.log('Editor details: ', editorDetails)
                    const userObj = user.toObject();
                    return {
                        ...userObj,
                        editorDetails: {
                            category: editorDetails.category || [],
                            score: editorDetails.score || 0,
                            ratingsCount: editorDetails.ratings?.length || 0,
                            averageRating: this.calculateAverageRating(editorDetails.ratings),
                            socialLinks: editorDetails.socialLinks || {},
                            createdAt: editorDetails.createdAt,
                        }
                    }
                }else console.log('no editor details');
            }
            return user;
        } catch (error) {
            this.logger.error(`Error fetching user details: ${error.message}`);
            throw error;
        }
    }

    private calculateAverageRating(ratings: any[] | undefined): number {
        if (!ratings || ratings.length === 0) return 0;
        
        const sum = ratings.reduce((acc, curr) => acc + curr.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    async requestForEditor(userId: Types.ObjectId): Promise<boolean> {
        try {
            
            const user = await this.userModel.findById(userId).select('isEditor');
            if (user && !user.isEditor) {
                this.logger.log(`User ${userId} is not an editor. Proceeding with request.`);
                await this.editorRequestModel.create({ userId });
                this.logger.log(`Editor request created for user ${userId}`);
                return true;
            }
            this.logger.log(`User ${userId} is already an editor or not found`);
            return false;
        } catch (error) {
            this.logger.error(`Error requesting editor role: ${error.message}`);
            return false;
        }
    }

    async getEditorRequestStatus(userId: Types.ObjectId): Promise<string | null>{
        try {
            const request = await this.editorRequestModel.findOne({ userId});
            if(request){
                this.logger.log(`Editor request status for user ${userId}: ${request.status}`);
                return request.status;
            }
            return null;
        } catch (error) {
            this.logger.error(`Error fetching editor request status: ${error.message}`);
            throw error;
        }
    }
}
