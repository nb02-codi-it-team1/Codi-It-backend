// src/order/dtos/create-order-item.dto.ts
import { Type, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @Transform(({ value, obj }) => value ?? obj?.product?.id ?? obj?.id)
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @Transform(({ value, obj }) => {
    const v = value ?? obj?.size?.id ?? obj?.size;
    return typeof v === 'string' ? Number(v) : v;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sizeId!: number;
  @Transform(({ value, obj }) => {
    const v = value ?? obj?.qty ?? obj?.q ?? 1;
    return typeof v === 'string' ? Number(v) : v;
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
