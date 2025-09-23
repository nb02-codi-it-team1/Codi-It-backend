import { Expose } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class StoreResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  createdAt: string;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  updatedAt: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  userId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  address: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  detailAddress: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  content: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @Expose()
  image?: string | null | undefined;
}
