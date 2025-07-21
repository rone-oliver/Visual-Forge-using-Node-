import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { BidStatus } from 'src/common/bids/models/bids.schema';

class EditorDto {
  @ApiProperty({ description: 'Unique identifier of the editor' })
  _id: string;

  @ApiProperty({ description: 'Full name of the editor' })
  fullname: string;

  @ApiProperty({ description: 'Email of the editor' })
  email: string;

  @ApiProperty({
    description: "URL to the editor's profile image",
    required: false,
  })
  profileImage?: string;
}

export class BidResponseDto {
  @ApiProperty({ description: 'Unique identifier of the bid' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'ID of the quotation this bid is for' })
  quotationId: Types.ObjectId;

  @ApiProperty({ description: 'ID of the editor who placed the bid' })
  editorId: Types.ObjectId;

  @ApiProperty({ description: 'Amount of the bid' })
  bidAmount: number;

  @ApiProperty({ description: 'Current status of the bid', enum: BidStatus })
  status: BidStatus;

  @ApiProperty({ description: 'Due date for the bid', type: Date })
  dueDate: Date;

  @ApiProperty({
    description: 'Additional notes from the editor',
    required: false,
  })
  notes?: string;

  @ApiProperty({ description: 'Date when the bid was created', type: Date })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the bid was last updated',
    type: Date,
  })
  updatedAt: Date;

  @ApiProperty({ type: EditorDto, description: 'Populated editor information' })
  editor: EditorDto;
}
