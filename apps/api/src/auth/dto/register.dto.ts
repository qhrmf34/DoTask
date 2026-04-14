import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, {
    message: '비밀번호는 영문과 숫자를 포함해야 합니다.',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 2자 이상이어야 합니다.' })
  nickname: string;
}
