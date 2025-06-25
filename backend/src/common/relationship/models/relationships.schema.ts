import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/models/user.schema';
import { RelationshipType } from 'src/common/enums/relationships.enum';

export type RelationshipDocument = Relationship & Document;

@Schema({ timestamps: true, collection: 'relationships' })
export class Relationship {
    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    sourceUser: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: User.name, required: true })
    targetUser: Types.ObjectId;

    @Prop({ type: String, enum: Object.values(RelationshipType), required: true })
    type: RelationshipType;
}

export const RelationshipSchema = SchemaFactory.createForClass(Relationship);

RelationshipSchema.index({ sourceUser: 1, targetUser: 1, type: 1 }, { unique: true });