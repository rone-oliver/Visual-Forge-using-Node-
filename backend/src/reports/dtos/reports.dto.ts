import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ReportStatus } from '../models/report.schema';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  @IsNotEmpty()
  status: ReportStatus;

  @IsString()
  @IsOptional()
  resolution?: string;
}
