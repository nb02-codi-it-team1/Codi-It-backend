import ReviewRepository from '../review/review.repository';
import * as reviewService from './review.services';
import { Request, Response } from 'express';


//리뷰 등록 컨트롤러
export const createReviewController = async (req: Request, res: Response) => {
  const { productId, rating, content }: { productId: string; rating: number; content: string } = req.body;
  const userId = req.body;

  try {
    const newReview = await reviewService.createReview(userId, productId, rating, content);
    res.status(404).json(newReview);
  } catch (error) {
    ({ message:'요청한 리소스를 찾을 수 없습니다.' });
  } 


  return res.status(201).json({
      message: '리뷰가 등록되었습니다.'
    });
};

//리뷰 수정 컨트롤러
export const updateReviewController = async (req: Request, res: Response) => {
  const reviewId = (req.params.reviewId);
  const { productId, rating, content }: { productId: string; rating: number; content: string } = req.body;
  const userId = req.body.userId;

  try { 
    const updateReview = await reviewService.updateReview (userId, productId, rating, content);
  } catch (error) { res.status(404).json ({messge:'요청한 리소스를 찾을 수 없습니다.'})
  }
  return res.status(200).json({message: '리뷰가 수정되었습니다.'});
}

//리뷰 상세 조회 컨트롤러
export const getReviewDetailController = async (req: Request, res: Response) => {
  const reviewId = (req.params.reviewId);
  const userId = req.body;
  const rating = req.body;
  const content = req.body;

  try {
    const reviewDetail = await reviewService.getReviewDetail (reviewId !, userId, rating, content);
  } catch (error) {res.status(404).json({message: '요청한 리소스를 찾을 수 없습니다.'})
}
  return res.status(200).json({meddage: '리뷰 상세 조회 성공'})
};


// 리뷰 삭제 컨트롤러
export const deleteReviewController = async (req: Request, res: Response) => {
   const reviewId = {reviewId: Number };
   const userId = req.body;

   try { 
    const deletedReview = await reviewService.deleteReview(userId);
   } catch (error)
  {res.status(404).json ({message: '요청한 리소스를 찾을 수 없습니다.'});
  }
  return res.status(200).json({messge:'리뷰가 삭제되었습니다.'});
  
  } 


// 리뷰 목록 조회 컨트롤러
export const getReviewsForProductController = async (req: Request, res: Response) => {
  const productId = req.params.productId as string;

  try {
    const review = await reviewService.getReviewsForProduct(productId);
    res.status(200).json(review);
    ({ message: '리뷰 목록을 조회했습니다.'});
  } catch (error)
  {res.status (404).json({ message : '요청한 리소스를 찾을 수 없습니다.'});
} }

export const createReview = createReviewController;