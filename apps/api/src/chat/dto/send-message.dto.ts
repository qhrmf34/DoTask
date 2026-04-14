import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsEnum(['TEXT', 'IMAGE', 'FILE'])
  @IsOptional()
  type?: 'TEXT' | 'IMAGE' | 'FILE';

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  fileName?: string;

  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  fileMimeType?: string;
}

export class UpdateMessageDto {
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class ReportMessageDto {
  @IsEnum(['SPAM', 'ABUSE', 'HATE', 'INAPPROPRIATE', 'OTHER'])
  reason: string;

  @IsString()
  @IsOptional()
  detail?: string;
}
