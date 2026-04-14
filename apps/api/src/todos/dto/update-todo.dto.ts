import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTodoDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;
}
