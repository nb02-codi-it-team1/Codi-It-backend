import { IsArray, IsString, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SizeQuantityDto } from './size-quantity.dto'; // 1-2에서 정의된 DTO import

export class UpdateCartBySizesDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizeQuantityDto)
  sizes: SizeQuantityDto[];
}
