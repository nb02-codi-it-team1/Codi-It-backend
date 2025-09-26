import { PrismaClient } from '@prisma/client';
//import { CreateReviewDto } from '../dtos/review.dto';

// 리뷰 생성 서비스
const prisma = new PrismaClient();
export const createReview = async (userId: string, productId: string, 
  rating: number, content: string): Promise<any> => {
  const newReview = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      content,
    },
  });
  return newReview;
};

//리뷰 수정 서비스
export const updateReview = async (userId: string, productId: string, 
  rating: number, content: string): Promise<any> => {
  const newReview = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      content,
    },
  });
};

//리뷰 상세 조회 서비스

export const getReviewDetail = async (userId: string, productId: string, 
  rating: number, content: string): Promise<any> => {
  const newReview = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      content,
    },
  });
  return newReview;
};

// 상품 리뷰 목록 조회 서비스(모든 조건을 만족하는 findMany 메서드 사용)
export const getReviewsForProduct = async (productId: string): Promise<any[]> => {
  const reviews = await prisma.review.findMany({
    where: {productId},
  });
  return reviews;
};

// 리뷰 삭제 서비스(모든 조건을 만족하는 fundMany로 삭제)
export const deleteReview = async (productId:string) => {
  const reviews = await prisma.review.deleteMany({
    where: {productId},
  });
  return reviews;
};