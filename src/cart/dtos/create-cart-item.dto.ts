import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';

export class CreateCartItemDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsNotEmpty()
  @IsInt()
  sizeId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}
