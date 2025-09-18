import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { UserType } from '@prisma/client';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: '비밀번호는 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자 이하여야 합니다.' })
  password: string;

  @IsNotEmpty()
  @IsEnum(UserType, { message: '회원 유형은 BUYER 또는 SELLER 여야 합니다.' })
  type: UserType;
}

export interface GradeResponseDto {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
}

export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  password: string;
  type: string;
  points: number | null;
  createdAt: Date;
  updatedAt: Date;
  image: string | null;
  grade: GradeResponseDto;
}
