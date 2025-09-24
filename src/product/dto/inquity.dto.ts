import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { InquiryStatus } from '@prisma/client';
export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isSecret: boolean;
}

export interface InquiryResponse {
  id: string;
  userId: string;
  productId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InquiriesResponse {
  id: string;
  userId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  isSecret: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: InquiryUser;
  reply: InquiryReplyResponse | null;
}

export interface InquiryUser {
  name: string;
}

export interface InquiryReplyResponse {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: InquiryUser;
}
