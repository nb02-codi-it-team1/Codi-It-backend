import { InquiryUser } from 'src/product/dto/inquiry.dto';
import { InquiryStatus } from '@prisma/client';
import { IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export interface InquiryList {
  list: InquiryItemDto[];
  totalCount: number;
}

export interface getMyInquiriesParams {
  page?: number;
  pageSize?: number;
  status?: InquiryStatus;
}

export interface InquiryStoreDto {
  id: string;
  name: string;
}

export interface InquiryProductDto {
  id: string;
  name: string;
  image: string;
  store: InquiryStoreDto;
}

export interface InquiryItemDto {
  id: string;
  title: string;
  isSecret: boolean;
  status: InquiryStatus;
  product: InquiryProductDto;
  user: InquiryUser;
  createdAt: Date;
  content: string;
}

export class UpdateInquiryDto {
  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  title?: string;

  @IsOptional()
  @IsString({ message: '내용은 문자열이어야 합니다.' })
  content?: string;

  @IsOptional()
  @IsBoolean({ message: '비밀글 여부는 true 또는 false 값이어야 합니다.' })
  isSecret?: boolean;
}

export class CreateOrUpdateInquiryReplyDto {
  @IsNotEmpty()
  @IsString({ message: '답변 내용은 문자열이어야 합니다.' })
  content: string;
}

export interface InquiryReplyResponse {
  id: string;
  inquiryId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: InquiryUser;
}
