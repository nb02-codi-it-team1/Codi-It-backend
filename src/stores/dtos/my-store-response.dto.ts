import { DetailResponseDto } from './detail-response.dto';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { Expose } from 'class-transformer';

export class MyStoreResponseDto extends DetailResponseDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  productCount: number;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  monthFavoriteCount: number;

  @IsNumber()
  @IsNotEmpty()
  @Expose()
  totalSoldCount: number;
}
