import { Router } from "express";
import { createReviewController, deleteReviewController, getReviewDetailController, getReviewsForProductController, updateReviewController } from "./review.controller";

const router = Router();

//리뷰 수정 라우터
router.put(":id", updateReviewController);

//리뷰 상세 조회 라우터
router.get("id", getReviewDetailController);

// 리뷰 등록 라우터
router.post("/review", createReviewController);

// 리뷰 삭제 라우터
router.delete("id", deleteReviewController);

// 리뷰 목록 조회 라우터
router.get("productId", getReviewsForProductController);

export default router;