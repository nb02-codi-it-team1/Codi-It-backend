// src/order/dtos/create-order.dto.ts
import { Type, Transform, Expose } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsString() @IsNotEmpty() name!: string;

  // phone → phoneNumber 매핑 + 문자열 강제
  @Expose({ name: 'phone' }) // ← phone 키가 있을 때 매핑
  @Transform(({ value, obj }) => {
    const v = value ?? obj.phoneNumber ?? obj.phone ?? '';
    return typeof v === 'string' ? v : String(v);
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsString() @IsNotEmpty() address!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  orderItems?: CreateOrderItemDto[];

  @Transform(({ value }) => (value == null ? 0 : typeof value === 'string' ? Number(value) : value))
  @Type(() => Number)
  @IsInt()
  @Min(0)
  usePoint!: number;
}
