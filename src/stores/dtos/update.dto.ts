import { IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @Length(1, 50)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 225)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 225)
  detailAddress?: string;

  @IsOptional()
  @IsPhoneNumber('KR')
  @Length(1, 20)
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  image?: string | null | undefined;
}
