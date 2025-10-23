import { Type, Transform, plainToInstance } from 'class-transformer';
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

export class StocksDto {
  @IsInt()
  sizeId: number;

  @IsInt()
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

export interface ProductListResponse {
  list: ProductListDto[];
  totalCount: number;
}

export class CreateProductDto {
  @IsNotEmpty({ message: '상품이름은 필수 입력 항목입니다.' })
  @IsString({ message: '상품번호는 문자열이어야 합니다.' })
  name: string;

  @IsNotEmpty({ message: '상품 가격은 필수 입력 항목입니다.' })
  @IsInt({ message: '상품 가격은 숫자여야 합니다.' })
  price: number;

  @IsOptional()
  @IsString({ message: '제품 상품 정보는 문자열이어야 합니다.' })
  content: string;

  @IsOptional()
  @IsString({ message: '상품이미지경로는 문자열이어야 합니다.' })
  image: string;

  @IsOptional()
  @IsInt({ message: '할인율은 숫자여야 합니다.' })
  discountRate: number;

  @IsOptional()
  @IsDate({ message: '할인기간은 날짜형식이어야 합니다.' })
  @Type(() => Date)
  discountStartTime: Date | null;

  @IsOptional()
  @IsDate({ message: '할인 기간은 날짜형식이어야 합니다.' })
  @Type(() => Date)
  discountEndTime: Date | null;

  @IsNotEmpty({ message: '상품 카테고리는 필수 입력 항목입니다.' })
  @IsString({ message: '상품 카테고리 이름은 문자열이어야 합니다.' })
  categoryName: CategoryType;

  @IsArray()
  @ValidateNested({ each: true })
  @IsNotEmpty({ message: '상품이름은 필수 입력 항목입니다.' })
  @Type(() => StocksDto)
  @Transform(({ value }): StocksDto[] => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // 배열이면 StocksDto로 매핑
        return Array.isArray(parsed) ? plainToInstance(StocksDto, parsed) : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  stocks: StocksDto[];
}

export class UpdateProductDto {
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
  @Type(() => StocksDto)
  @Transform(({ value }): StocksDto[] => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // 배열이면 StocksDto로 매핑
        return Array.isArray(parsed) ? plainToInstance(StocksDto, parsed) : [];
      } catch {
        return [];
      }
    }
    return [];
  })
  stocks?: StocksDto[];
}

export interface ReviewDto {
  rate1Length: number;
  rate2Length: number;
  rate3Length: number;
  rate4Length: number;
  rate5Length: number;
  sumScore: number;
}

export enum CategoryType {
  TOP = 'top',
  BOTTOM = 'bottom',
  DRESS = 'dress',
  OUTER = 'outer',
  SKIRT = 'skirt',
  SHOES = 'shoes',
  ACC = 'acc',
}
export class CategoryResponse {
  id: string;
  name: CategoryType;
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

export interface StockResponse {
  id: string;
  productId: string;
  quantity: number;
  size: {
    id: number;
    name: string;
  };
}

export class InquiryReply {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export class DetailInquiry {
  id: string;
  title: string;
  content: string;
  status: string;
  isSecret: boolean;
  createdAt: string;
  updatedAt: string;
  reply?: InquiryReply | null;
}

export interface DetailProductResponse {
  id: string;
  name: string;
  image: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reviewsRating: number;
  storeId: string;
  storeName: string;
  price: number;
  discountPrice: number;
  discountRate: number;
  discountStartTime: string | null;
  discountEndTime: string | null;
  reviewsCount: number;
  reviews: ReviewDto[];
  inquiries: DetailInquiry[];
  category: CategoryResponse;
  stocks: StockResponse[];
}

export interface StoreInfoProps {
  id: string;
  name: string;
  address?: string;
  detailAddress?: string;
  phoneNumber?: string;
  favoriteCount?: number;
  content?: string;
  image?: string;
}
