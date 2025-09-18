import {
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export interface StocksDto {
  sizeId: string;
  quantity: number;
}

export interface GetProductsParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  priceMin?: number;
  priceMax?: number;
  size?: string;
  favoriteStore?: string;
  categoryName?: string;
}

export interface ProductListDto {
  id: string;
  storeId: string;
  storeName: string;
  name: string;
  image: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  discountStartTime?: Date | null;
  discountEndTime?: Date | null;
  reviewsCount: number;
  reviewsRating: number;
  createdAt: string;
  updatedAt: string;
  sales: number;
  isSoldOut: boolean;
}

export class CreateProductDto {
  @IsNotEmpty({ message: '상품이름은 필수 입력 항목입니다.' })
  @IsString({ message: '상품번호는 문자열이어야 합니다.' })
  name: string;

  @IsNotEmpty({ message: '상품 가격은 필수 입력 항목입니다.' })
  @IsInt({ message: '상품 가격은 숫자여야 합니다.' })
  price: number;

  @IsOptional()
  @IsString({ message: '상품설명은 문자열이어야 합니다.' })
  content: string;

  @IsOptional()
  @IsString({ message: '상품이미지경로는 문자열이어야 합니다.' })
  image: string;

  @IsOptional()
  @IsInt({ message: '할인율은 숫자여야 합니다.' })
  discountRate: number;

  @IsOptional()
  @IsDate({ message: '할인기간은 날짜형식이어야 합니다.' })
  discountStartTime: Date | null;

  @IsOptional()
  @IsDate({ message: '상품 가격은 숫자여야 합니다.' })
  discountEndTime: Date | null;

  @IsNotEmpty({ message: '상품 카테고리는 필수 입력 항목입니다.' })
  @IsString({ message: '상품 카테고리 이름은 문자열이어야 합니다.' })
  categoryName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty({ message: '상품이름은 필수 입력 항목입니다.' })
  @IsString({ message: '상품번호는 문자열이어야 합니다.' })
  stocks: StocksDto[];
}

export class UpdateProductDto {
  @IsString({ message: '상품 ID는 문자열이어야 합니다.' })
  id: string;

  @IsOptional()
  @IsString({ message: '상품 이름은 문자열이어야 합니다.' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: '가격은 숫자여야 합니다.' })
  price?: number;

  @IsOptional()
  @IsString({ message: '제품 상세 정보는 문자열이어야 합니다.' })
  content?: string;

  @IsOptional()
  @IsString({ message: '이미지 URL은 문자열이어야 합니다.' })
  image?: string;

  @IsOptional()
  @IsNumber({}, { message: '할인율은 숫자여야 합니다.' })
  discountRate?: number;

  @IsOptional()
  @IsString({ message: '할인 시작 날짜는 문자열이어야 합니다.' })
  discountStartTime?: string;

  @IsOptional()
  @IsString({ message: '할인 종료 날짜는 문자열이어야 합니다.' })
  discountEndTime?: string;

  @IsOptional()
  @IsString({ message: '카테고리 이름은 문자열이어야 합니다.' })
  categoryName?: string;

  @IsOptional()
  @IsBoolean({ message: '매진 여부는 true/false여야 합니다.' })
  isSoldOut?: boolean;

  @IsArray({ message: 'stocks는 배열이어야 합니다.' })
  @ValidateNested({ each: true })
  stocks?: StocksDto[];
}

export interface ReviewCount {
  rate1Length: number;
  rate2Length: number;
  rate3Length: number;
  rate4Length: number;
  rate5Length: number;
  sumScore: number;
}

interface StockSize {
  id: number;
  name: string;
}

// 재고
export interface Stock {
  id: string;
  quantity: number;
  size: StockSize;
}

export interface ProductInfoData {
  id: string;
  name: string;
  image: string;
  createdAt: string;
  updatedAt: string;
  reviewsRating: number;
  content: string;
  storeId: string;
  storeName: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  discountStartTime: string;
  discountEndTime: string;
  reviewsCount: number;
  reviews: ReviewCount;
  inquiries: unknown[];
  category: unknown;
  stocks: Stock[];
  store?: unknown;
}
