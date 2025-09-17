import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 225)
  address: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 225)
  detailAddress: string;

  @IsNotEmpty()
  @IsPhoneNumber('KR')
  @Length(1, 20)
  phoneNumber: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  image?: string | null | undefined;
}
