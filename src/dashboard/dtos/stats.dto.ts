import { IsNumber, IsNotEmpty } from 'class-validator';

export class SalesStatsDto {
  @IsNumber()
  @IsNotEmpty()
  totalOrders: number;

  @IsNumber()
  @IsNotEmpty()
  totalSales: number;
}
