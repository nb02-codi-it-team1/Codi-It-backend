import { IsDecimal, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class PriceRangeItemDto {
  @IsNotEmpty()
  @IsString()
  priceRange: string;

  @IsNotEmpty()
  @IsDecimal()
  totalSales: number;

  @IsNotEmpty()
  @IsNumber()
  percentage: number;
}
