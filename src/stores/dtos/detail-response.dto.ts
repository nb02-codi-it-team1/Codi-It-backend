import { IsNotEmpty, IsNumber } from 'class-validator';
import { StoreResponseDto } from './response.dto';
import { Expose } from 'class-transformer';

export class DetailResponseDto extends StoreResponseDto {
  @IsNumber()
  @IsNotEmpty()
  @Expose()
  favoriteCount: number;
}
