import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @IsOptional()
  nickname?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  bio?: string;
}
