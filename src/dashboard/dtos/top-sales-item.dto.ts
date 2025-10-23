import { Type } from 'class-transformer';
import { IsDecimal, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class ProductInfoDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsDecimal()
  price: number;
}

export class TopSalesItemDto {
  @IsNotEmpty()
  @IsNumber()
  totalOrders: number;

  @Type(() => ProductInfoDto)
  @ValidateNested()
  @IsNotEmpty()
  products: ProductInfoDto;
}
