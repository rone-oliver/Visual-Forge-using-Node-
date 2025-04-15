import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/models/user.schema';
import { Admin, AdminDocument } from './models/admin.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EditorRequest, EditorRequestDocument, EditorRequestStatus } from 'src/common/models/editorRequest.schema';
import { Editor, EditorDocument } from 'src/editors/models/editor.schema';

@Injectable()
export class AdminsService {
    private readonly logger = new Logger(AdminsService.name);

    constructor(
        @InjectModel(Admin.name) private adminModel:Model<AdminDocument>,
        @InjectModel(User.name) private userModel:Model<UserDocument>,
        @InjectModel(EditorRequest.name) private editorRequestModel: Model<EditorRequestDocument>,
        @InjectModel(Editor.name) private editorModel: Model<EditorDocument>,
    ){};

    async findOne(filter: Partial<Admin>): Promise<Admin | null>{
        try {
            return this.adminModel.findOne(filter).exec();
        } catch (error) {
            throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
        }
    }

    async createAdmin(adminData: any){
        adminData.password = await bcrypt.hash(adminData.password,10);
        return this.adminModel.create(adminData);
    }

    async getAllUsers(){
        try {
            return await this.userModel.find({isVerified:true});
        } catch (error) {
            console.error('Error fetching users:', error);
            throw new HttpException('No users found', HttpStatus.NOT_FOUND);
        }
    }

    async getEditorRequests(){
        try {
            const requests = await this.editorRequestModel.find({ status: EditorRequestStatus.PENDING }).populate('userId');
            
            return requests.map(request => {
                const user = request.userId as any;
                
                return {
                    _id: request._id,
                    userId: user._id,
                    fullname: user.fullname,
                    email: user.email,
                    categories: request.categories,
                    createdAt: request.createdAt,
                    status: request.status,
                    reason: request.reason
                };
            });
        } catch (error) {
            this.logger.error(`Error fetching editor requests: ${error.message}`);
            throw new HttpException('No editor requests found', HttpStatus.NOT_FOUND);
        }
    }

    async approveRequest(requestId: Types.ObjectId, adminId: Types.ObjectId): Promise<boolean>{
        try {
            const request = await this.editorRequestModel.findOneAndUpdate({ _id: requestId}, { status: EditorRequestStatus.APPROVED, approvedBy: adminId});
            if(request && request.userId){
                await this.userModel.updateOne({ _id: request.userId},{isEditor: true});
                await this.editorModel.create({userId: new Types.ObjectId(request.userId), category: [request.categories]});
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Error approving request: ${error.message}`);
            throw new HttpException('Failed to approve request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async rejectRequest(requestId: Types.ObjectId,reason: string){
        try {
            const request = await this.editorRequestModel.findOneAndUpdate({ _id: requestId}, { status: EditorRequestStatus.REJECTED, reason});
            return request !== null;
        } catch (error) {
            this.logger.error(`Error rejecting request: ${error.message}`);
            throw new HttpException('Failed to reject request', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getEditors(){
        try {
            const editors = await this.editorModel.find({}).populate('userId');
            return editors.map(editor => {
                const user = editor.userId as any;
                return {
                    _id: editor._id,
                    userId: user._id,

                    //user info
                    fullname: user.fullname,
                    username: user.username,
                    email: user.email,
                    profileImage: user.profileImage,

                    // Editor info
                    category: editor.category || [],
                    score: editor.score || 0,
                    ratingsCount: editor.ratings?.length || 0,
                    averageRating: editor.ratings?.length ? 
                        editor.ratings.reduce((sum,r)=> sum+r.rating, 0)/editor.ratings.length :
                        0,

                    // status
                    createdAt: editor.createdAt,
                    isVerified: user.isVerified,
                    isBlocked: user.isBlocked,

                    // social links
                    socialLinks: editor.socialLinks || {}
                };
            });
        } catch (error) {
            this.logger.error(`Error fetching editors: ${error.message}`);
            throw new HttpException('No editors found', HttpStatus.NOT_FOUND);
        }
    }
}