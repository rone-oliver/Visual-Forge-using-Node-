import { Injectable, Inject, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './models/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

    async findOne(filter: Partial<User>): Promise<User | null> {
        try {
            this.logger.log(`Creating new user: ${filter.email}`);
            return this.userModel.findOne(filter).exec();
        } catch (error) {
            this.logger.error(`Error finding user: ${error.message}`);
            // throw error;
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
    }

    async findByUsername(username:string){
        return await this.userModel.findOne({ username });
    }

    async findByEmail(email:string){
        return await this.userModel.findOne({ email });
    }
    
    async createUser(user: Partial<User>): Promise<User> {
        try {
            if(user.password){
                user.password = await bcrypt.hash(user.password,10);
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
            return await this.userModel.findOneAndUpdate({_id: userId},{$set:{googleId}},{new: true})
        } catch (error) {
            this.logger.error(`Error updating user: ${error.message}`);
            throw error;
        }
    }

    async updateOne(filter: Partial<User>, update:Partial<User>){
        try {
            await this.userModel.updateOne(filter,update);
            this.logger.log("User data updated successfully");
        } catch (error) {
            this.logger.error(`Error updating User: ${error.message}`);
            throw error;
        }
    }
}
