import { IsNotEmpty, IsNumber } from 'class-validator';

export class ChangeRateDto {
  @IsNotEmpty()
  @IsNumber()
  totalOrders: number;

  @IsNotEmpty()
  @IsNumber()
  totalSales: number;
}
