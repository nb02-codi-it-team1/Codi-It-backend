import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class ProductResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @Expose()
  image: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsDecimal()
  @IsNotEmpty()
  @Expose()
  price: number;

  @IsInt()
  @IsNotEmpty()
  @Expose()
  stock: number;

  @IsBoolean()
  @Expose()
  isDiscount: boolean;

  @IsDateString()
  @IsNotEmpty()
  @Expose()
  createdAt: string;

  @IsBoolean()
  @Expose()
  isSoldOut: boolean;
}
