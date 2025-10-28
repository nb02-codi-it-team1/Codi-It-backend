import { IsOptional, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: '비밀번호는 최소 2자 이상이어야 합니다.' })
  @MaxLength(50, { message: '비밀번호는 최대 50자 이하여야 합니다.' })
  password?: string;
}
