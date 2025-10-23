import { Type } from 'class-transformer';
import { PeriodSummaryDto } from './period.dto';
import { PriceRangeItemDto } from './price-range-item.dto';
import { TopSalesItemDto } from './top-sales-item.dto';
import { IsNotEmpty, ValidateNested } from 'class-validator';

export class DashboardResponseDto {
  @Type(() => PeriodSummaryDto)
  @ValidateNested()
  @IsNotEmpty()
  today: PeriodSummaryDto;

  @Type(() => PeriodSummaryDto)
  @ValidateNested()
  @IsNotEmpty()
  week: PeriodSummaryDto;

  @Type(() => PeriodSummaryDto)
  @ValidateNested()
  @IsNotEmpty()
  month: PeriodSummaryDto;

  @Type(() => PeriodSummaryDto)
  @ValidateNested()
  @IsNotEmpty()
  year: PeriodSummaryDto;

  @Type(() => TopSalesItemDto)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  topSales: TopSalesItemDto[];

  @Type(() => PriceRangeItemDto)
  @ValidateNested({ each: true })
  @IsNotEmpty()
  priceRange: PriceRangeItemDto[];
}
