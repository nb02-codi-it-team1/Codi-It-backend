export interface CreateReviewDto {
  userId: string;
  productId: string;
  rating: number;
  content: string;
}

export interface ReviewDto {
    id: number
    userId: number
    productId: number
    rating: number;
    content: string;
    createAt: Date;
}
export interface ReviewResponseDto {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  content: string;
  createAt: Date;
}