import { PrismaClient } from '@prisma/client';
import { ReviewRepository } from '../review/review.repository';
import { ReviewResponseDto } from '../review/dtos/review.dto';
import Reviewrouter from '../review/review.router';
export default class ReviewService {
  private readonly reviewRepository: ReviewRepository;
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.reviewRepository = new ReviewRepository(prismaClient);
    this.prisma = prismaClient;
  }

  async createReview(
    userId: string,
    productId: string,
    rating: number,
    content: string
  ): Promise<ReviewResponseDto> {
    // 여기에 로직 추가 예정
    return  {
      id: '1',
      userId,
      productId,
      rating,
      content,
      createAt: new Date(),
    };
  }
}
export function updateReview(userId: any, productId: string, rating: number, content: string) {
  throw new Error('Function not implemented.');
}

export function getReviewDetail(arg0: string, userId: any, rating: any, content: any) {
  throw new Error('Function not implemented.');
}

export function createReview(userId: any, productId: string, rating: number, content: string) {
  throw new Error('Function not implemented.');
}

export function deleteReview(userId: any) {
  throw new Error('Function not implemented.');
}

export function getReviewsForProduct(productId: string) {
  throw new Error('Function not implemented.');
}

