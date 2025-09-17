import {
  IsInt,
  isNotEmpty,
  IsNotEmpty,
  isNumber,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export interface StocksDto {
  sizeId: number;
  quantity: number;
}

export class CreateProductDto {
  @IsNotEmpty({ message: '상품이름은 필수 입력 항목입니다.'})
  @IsString({ message: '상품번호는 문자열이어야 합니다.' })
  name: string;

  @IsNotEmpty({ message: '상품 가격은 필수 입력 항목입니다.'})
  @IsInt({ message: '상품 가격은 숫자여야 합니다.' })
  price: number;
  content: string;
  image: string;
  discountRate: number;
  discountStartTime: Date;
  discountEndTime: Date;
  categoryName: string;
  stocks: StocksDto;
}
