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
/**
 * @swagger
 * /api/inquiries:
 *   get:
 *     summary: 내 문의 리스트 조회
 *     description: 내 문의 리스트를 페이지 단위로 조회합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - name: page
 *         in: query
 *         description: "페이지 번호"
 *         schema:
 *           type: number
 *           example: 1
 *       - name: pageSize
 *         in: query
 *         description: "페이지 리스트 갯수"
 *         schema:
 *           type: number
 *           example: 16
 *       - name: status
 *         in: query
 *         description: "답변 상태 (completedAnswer: 답변 완료, waitingAnswer: 답변 대기)"
 *         schema:
 *           type: string
 *           enum: [completedAnswer, waitingAnswer]
 *           example: completedAnswer
 *     responses:
 *       200:
 *         description: 내 문의 리스트 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 list:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MyInquiryItem'
 *                 totalCount:
 *                   type: integer
 *                   example: 900
 */
router.get('/', passport.authenticate('jwt', { session: false }), getMyInquiries);

// 문의 상세조회
// 문의 상세 조회
/**
 * @swagger
 * /api/inquiries/{inquiryId}:
 *   get:
 *     summary: 문의 상세 조회
 *     description: 특정 문의의 상세 정보를 조회합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - name: inquiryId
 *         in: path
 *         required: true
 *         description: "조회할 문의의 ID"
 *         schema:
 *           type: string
 *           example: "inquiryId"
 *     responses:
 *       200:
 *         description: 문의 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InquiryDetail'
 *       404:
 *         description: 문의가 존재하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "문의가 존재하지 않습니다."
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 */

router.get('/:inquiryId', passport.authenticate('jwt', { session: false }), getDetailInquiry);

// 문의 수정
/**
 * @swagger
 * /api/inquiries/{inquiryId}:
 *   patch:
 *     summary: 문의 수정
 *     description: 특정 문의의 제목, 내용, 비밀글 여부를 수정합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - name: inquiryId
 *         in: path
 *         required: true
 *         description: "수정할 문의의 ID"
 *         schema:
 *           type: string
 *           example: "inquiryId"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInquiryRequest'
 *     responses:
 *       200:
 *         description: 문의 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateInquiryResponse'
 *       404:
 *         description: 문의가 존재하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "문의가 존재하지 않습니다."
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 */
router.patch(
  '/:inquiryId',
  validateDto(UpdateInquiryDto),
  passport.authenticate('jwt', { session: false }),
  authorizeBuyer,
  updateInquiry
);

// 문의 삭제
/**
 * @swagger
 * /api/inquiries/{inquiryId}:
 *   delete:
 *     summary: 문의 삭제
 *     description: 특정 문의를 삭제합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - name: inquiryId
 *         in: path
 *         required: true
 *         description: "삭제할 문의의 ID"
 *         schema:
 *           type: string
 *           example: "inquiryId"
 *     responses:
 *       200:
 *         description: 문의 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateInquiryResponse'
 *       404:
 *         description: 문의가 존재하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "문의가 존재하지 않습니다."
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 */
router.delete(
  '/:inquiryId',
  passport.authenticate('jwt', { session: false }),
  authorizeBuyer,
  deleteInquiry
);

// 문의 답변
/**
 * @swagger
 * /api/inquiries/{inquiryId}/replies:
 *   post:
 *     summary: 문의 답변 생성
 *     description: 특정 문의에 대한 답변을 생성합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - in: path
 *         name: inquiryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 답변을 작성할 문의 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInquiryReplyRequest'
 *     responses:
 *       201:
 *         description: 문의 답변 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateInquiryReplyResponse'
 */
router.post(
  '/:inquiryId/replies',
  validateDto(CreateOrUpdateInquiryReplyDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  postInquiryReply
);

// 문의 답변 상세조회
/**
 * @swagger
 * /api/inquiries/{replyId}/replies:
 *   get:
 *     summary: 문의 답변 상세 조회
 *     description: 특정 문의의 답변 상세 정보를 조회합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - name: replyId
 *         in: path
 *         required: true
 *         description: "조회할 문의 답변의 ID"
 *         schema:
 *           type: string
 *           example: "replyId"
 *     responses:
 *       200:
 *         description: 문의 답변 상세 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InquiryDetail'
 *       404:
 *         description:  답변이 존재하지 않습니다.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "답변이 존재하지 않습니다."
 *                 statusCode:
 *                   type: integer
 *                   example: 404
 *                 error:
 *                   type: string
 *                   example: "Not Found"
 */
router.get('/:replyId/replies', passport.authenticate('jwt', { session: false }), getDetailReply);

// 문의 답변 수정
/**
 * @swagger
 * /api/inquiries/{replyId}/replies:
 *   patch:
 *     summary: 문의 답변 수정
 *     description: 특정 문의 답변을 수정합니다.
 *     tags: [Inquiry]
 *     parameters:
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *         description: 수정할 답변 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateInquiryReplyRequest'
 *     responses:
 *       200:
 *         description: 문의 답변 수정 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateInquiryReplyResponse'
 */
router.patch(
  '/:replyId/replies',
  validateDto(CreateOrUpdateInquiryReplyDto),
  passport.authenticate('jwt', { session: false }),
  authorizeSeller,
  updateReply
);
export default router;
