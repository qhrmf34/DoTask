import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  title: string;

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
}
