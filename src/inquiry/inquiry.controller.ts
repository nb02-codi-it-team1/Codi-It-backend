import { Request, Response, NextFunction } from 'express';
import { inquiryService } from './inquiry.service';
import { InquiryStatus } from '@prisma/client';
import { getMyInquiriesParams } from './dto/inquiry.dto';
import { BadRequestError } from 'src/common/errors/error-type';

// 내 문의 리스트 조회
export const getMyInquiries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;

    const status = req.query.status as InquiryStatus | undefined;

    const params: getMyInquiriesParams = {
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 16,
      status,
    };
    const myInquiries = await inquiryService.getMyInquiries(userId, params);
    res.status(200).json(myInquiries);
  } catch (error) {
    next(error);
  }
};

// 문의 상세 조회
export const getDetailInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;

    const inquiryId = req.params.inquiryId;
    if (!inquiryId) {
      throw new BadRequestError();
    }
    const detailInquiry = await inquiryService.getDetailInquiry(userId, inquiryId);
    res.status(200).json(detailInquiry);
  } catch (error) {
    next(error);
  }
};

// 문의 수정
export const updateInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const inquiryId = req.params.inquiryId;
    if (!inquiryId) {
      throw new BadRequestError();
    }
    const { title, content, isSecret } = req.body;
    const updateInquiry = await inquiryService.updateInquiry(userId, inquiryId, {
      title,
      content,
      isSecret,
    });
    res.status(201).json(updateInquiry);
  } catch (error) {
    next(error);
  }
};

// 문의 삭제
export const deleteInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const inquiryId = req.params.inquiryId;
    if (!inquiryId) {
      throw new BadRequestError();
    }
    const deleteInquiry = await inquiryService.deleteInquiry(userId, inquiryId);
    res.status(200).json(deleteInquiry);
  } catch (error) {
    next(error);
  }
};

// 문의 답변 생성
export const postInquiryReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const inquiryId = req.params.inquiryId;
    if (!inquiryId) {
      throw new BadRequestError();
    }
    const { content } = req.body;
    const createReply = await inquiryService.postInquiryReply(userId, inquiryId, { content });
    res.status(201).json(createReply);
  } catch (error) {
    next(error);
  }
};

// 문의 답변 상세조회
export const getDetailReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const replyId = req.params.replyId;
    if (!replyId) {
      throw new BadRequestError();
    }
    const detailReply = await inquiryService.getDetailReply(userId, replyId);
    res.status(200).json(detailReply);
  } catch (error) {
    next(error);
  }
};

// 문의 답변 수정
export const updateReply = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const replyId = req.params.replyId;
    if (!replyId) {
      throw new BadRequestError();
    }
    const { content } = req.body;
    const updateReply = await inquiryService.updateReply(userId, replyId, { content });
    res.status(200).json(updateReply);
  } catch (error) {
    next(error);
  }
};
