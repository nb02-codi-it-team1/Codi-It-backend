import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { UserType } from '@prisma/client';

export class LoginDto {
  @IsNotEmpty()
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: '비밀번호는 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자 이하여야 합니다.' })
  password: string;
}

export interface LoginResponseDto {
  user: {
    id: string;
    email: string;
    name: string;
    type: UserType;
    points: number;
    image: string | null;
    grade: {
      id: string;
      name: string;
      rate: number;
      minAmount: number;
    };
  };
  accessToken: string;
}
