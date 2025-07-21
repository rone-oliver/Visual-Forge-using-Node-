import { ApiProperty } from '@nestjs/swagger';

export class CreateBidDto {
  @ApiProperty({ description: 'ID of the quotation this bid is for' })
  quotationId: string;

  @ApiProperty({ description: 'Amount of the bid' })
  bidAmount: number;

  @ApiProperty({ description: 'Due date for the bid', type: Date })
  dueDate: Date;

  @ApiProperty({ description: 'Notes for the bid', required: false })
  notes?: string;
}
