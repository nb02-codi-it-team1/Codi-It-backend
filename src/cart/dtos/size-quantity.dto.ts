import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class SizeQuantityDto {
  @IsNotEmpty()
  @IsInt()
  sizeId: number;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  quantity: number;
}
