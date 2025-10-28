import { Expose, Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, ValidateNested } from 'class-validator';
import { ProductResponseDto } from './product-response.dto';

export class MyStoreProductResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductResponseDto)
  @Expose()
  list: ProductResponseDto[];

  @IsInt()
  @IsNotEmpty()
  @Expose()
  totalCount: number;
}
