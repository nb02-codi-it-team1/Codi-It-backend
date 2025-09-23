import { Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { StoreResponseDto } from './response.dto';

export class StoreLikeResponseDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  type: string;

  @ValidateNested()
  @Type(() => StoreResponseDto)
  @Expose()
  store: StoreResponseDto;
}
