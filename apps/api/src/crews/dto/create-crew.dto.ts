import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCrewDto {
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;

  @IsString()
  @IsOptional()
  emoji?: string;

  @IsString()
  @IsOptional()
  themeColor?: string;

  @IsString()
  category: string;

  @IsEnum(['PUBLIC', 'PASSWORD', 'PRIVATE'])
  @IsOptional()
  visibility?: 'PUBLIC' | 'PASSWORD' | 'PRIVATE';

  @IsString()
  @IsOptional()
  password?: string;

  @IsInt()
  @Min(2)
  @Max(100)
  @IsOptional()
  maxMembers?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  rules?: string;
}
