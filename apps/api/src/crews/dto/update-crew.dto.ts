import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class UpdateCrewDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsString()
  themeColor?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['PUBLIC', 'PASSWORD', 'PRIVATE'])
  visibility?: 'PUBLIC' | 'PASSWORD' | 'PRIVATE';

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxMembers?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  rules?: string;
}
