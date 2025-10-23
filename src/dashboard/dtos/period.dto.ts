import { IsNotEmpty, ValidateNested } from 'class-validator';
import { ChangeRateDto } from './change-rate.dto';
import { SalesStatsDto } from './stats.dto';
import { Type } from 'class-transformer';

export class PeriodSummaryDto {
  @Type(() => SalesStatsDto)
  @ValidateNested()
  @IsNotEmpty()
  current: SalesStatsDto;

  @Type(() => SalesStatsDto)
  @ValidateNested()
  @IsNotEmpty()
  previous: SalesStatsDto;

  @Type(() => ChangeRateDto)
  @ValidateNested()
  @IsNotEmpty()
  changeRate: ChangeRateDto;
}
