import { Router } from 'express';
import passport from 'passport';
import {
  deleteInquiry,
  getDetailInquiry,
  getDetailReply,
  getMyInquiries,
  postInquiryReply,
  updateInquiry,
  updateReply,
} from './inquiry.controller';
import validateDto from 'src/common/utils/validate.dto';
import { UpdateInquiryDto, CreateOrUpdateInquiryReplyDto } from './dto/inquiry.dto';
import { authorizeBuyer, authorizeSeller } from 'src/middleware/authorization';
const router = Router();

// 내 문의 조회 (판매자, 구매자 공용)
router.get('/', passport.authenticate('jwt', { session: false }), getMyInquiries);

// 문의 상세조회
router.get('/:inquiryId', passport.authenticate('jwt', { session: false }), getDetailInquiry);

// 문의 수정
router.patch(
  '/:inquiryId',
  validateDto(UpdateInquiryDto),
  passport.authenticate('jwt', { session: false }),
  authorizeBuyer,
  updateInquiry
);

// 문의 삭제
router.delete(
  '/:inquiryId',
  passport.authenticate('jwt', { session: false }),
  authorizeBuyer,
  deleteInquiry
);

// 문의 답변
router.post(
  '/:inquiryId/replies',
  validateDto(CreateOrUpdateInquiryReplyDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  postInquiryReply
);

// 문의 답변 상세조회
router.get('/:replyId/replies', passport.authenticate('jwt', { session: false }), getDetailReply);

// 문의 답변 수정
router.patch(
  '/:replyId/replies',
  validateDto(CreateOrUpdateInquiryReplyDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  updateReply
);
export default router;
