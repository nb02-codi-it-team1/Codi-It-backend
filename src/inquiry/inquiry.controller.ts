// import { Request, Response, NextFunction } from 'express';
// import { inquiryService } from './inquiry.service';
// import { InquiryStatus, UserType } from '@prisma/client';
// import { getMyInquiriesParams } from './dto/inquiry.dto';
// import { BadRequestError } from 'src/common/errors/error-type';

// // 내 문의 리스트 조회
// export const getMyInquiries = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const role = req.user?.type as UserType;
//     const status = req.query.status as InquiryStatus | undefined;

//     const params: getMyInquiriesParams = {
//       page: req.query.page ? Number(req.query.page) : 1,
//       pageSize: req.query.pageSize ? Number(req.query.pageSize) : 16,
//       status,
//     };
//     const myInquiries = await inquiryService.getMyInquiries(userId, params, role);
//     res.status(200).json(myInquiries);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 상세 조회
// export const getDetailInquiry = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;

//     const inquiryId = req.params.inquiryId;
//     if (!inquiryId) {
//       throw new BadRequestError();
//     }
//     const detailInquiry = await inquiryService.getDetailInquiry(userId, inquiryId);
//     res.status(200).json(detailInquiry);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 수정
// export const updateInquiry = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const inquiryId = req.params.inquiryId;
//     if (!inquiryId) {
//       throw new BadRequestError();
//     }
//     const { title, content, isSecret } = req.body;
//     const updateInquiry = await inquiryService.updateInquiry(userId, inquiryId, {
//       title,
//       content,
//       isSecret,
//     });
//     res.status(201).json(updateInquiry);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 삭제
// export const deleteInquiry = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const inquiryId = req.params.inquiryId;
//     if (!inquiryId) {
//       throw new BadRequestError();
//     }
//     const deleteInquiry = await inquiryService.deleteInquiry(userId, inquiryId);
//     res.status(200).json(deleteInquiry);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 답변 생성
// export const postInquiryReply = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const inquiryId = req.params.inquiryId;
//     if (!inquiryId) {
//       throw new BadRequestError();
//     }
//     const { content } = req.body;
//     const createReply = await inquiryService.postInquiryReply(userId, inquiryId, { content });
//     res.status(201).json(createReply);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 답변 상세조회
// export const getDetailReply = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const replyId = req.params.replyId;
//     if (!replyId) {
//       throw new BadRequestError();
//     }
//     const detailReply = await inquiryService.getDetailReply(userId, replyId);
//     res.status(200).json(detailReply);
//   } catch (error) {
//     next(error);
//   }
// };

// // 문의 답변 수정
// export const updateReply = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const replyId = req.params.replyId;
//     if (!replyId) {
//       throw new BadRequestError();
//     }
//     const { content } = req.body;
//     const updateReply = await inquiryService.updateReply(userId, replyId, { content });
//     res.status(200).json(updateReply);
//   } catch (error) {
//     next(error);
//   }
// };

import { Request, Response, NextFunction } from 'express';
import InquiryService from './inquiry.service';
import { InquiryStatus, UserType } from '@prisma/client';
import {
  getMyInquiriesParams,
  CreateOrUpdateInquiryReplyDto,
  UpdateInquiryDto,
} from './dto/inquiry.dto';
import { BadRequestError } from 'src/common/errors/error-type';

export default class InquiryController {
  private readonly inquiryService: InquiryService;

  constructor(inquiryService: InquiryService) {
    this.inquiryService = inquiryService;
  }

  // 내 문의 리스트 조회
  getMyInquiries = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const role = req.user?.type as UserType;
      const status = req.query.status as InquiryStatus | undefined;

      const params: getMyInquiriesParams = {
        page: req.query.page ? Number(req.query.page) : 1,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : 16,
        status,
      };

      if (!userId) {
        // 인증 미들웨어에서 처리되겠지만, 안전장치로 추가
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const myInquiries = await this.inquiryService.getMyInquiries(userId, params, role);
      res.status(200).json(myInquiries);
    } catch (error) {
      return next(error);
    }
  };

  // 문의 상세 조회
  getDetailInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const inquiryId = req.params.inquiryId;

      if (!inquiryId) {
        throw new BadRequestError('문의 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const detailInquiry = await this.inquiryService.getDetailInquiry(userId, inquiryId);
      return res.status(200).json(detailInquiry);
    } catch (error) {
      return next(error);
    }
  };

  // 문의 수정
  updateInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const inquiryId = req.params.inquiryId;

      if (!inquiryId) {
        throw new BadRequestError('문의 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      // DTO 형태로 변환
      const { title, content, isSecret } = req.body;
      const data: UpdateInquiryDto = { title, content, isSecret };

      const updatedInquiry = await this.inquiryService.updateInquiry(userId, inquiryId, data);
      return res.status(200).json(updatedInquiry); // 일반적으로 수정은 200 OK를 사용합니다.
    } catch (error) {
      return next(error);
    }
  };

  // 문의 삭제
  deleteInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const inquiryId = req.params.inquiryId;

      if (!inquiryId) {
        throw new BadRequestError('문의 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const deleteInquiry = await this.inquiryService.deleteInquiry(userId, inquiryId);
      return res.status(200).json(deleteInquiry);
    } catch (error) {
      return next(error);
    }
  };

  // 문의 답변 생성
  postInquiryReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const inquiryId = req.params.inquiryId;

      if (!inquiryId) {
        throw new BadRequestError('문의 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const { content } = req.body;
      const data: CreateOrUpdateInquiryReplyDto = { content };

      const createReply = await this.inquiryService.postInquiryReply(userId, inquiryId, data);
      return res.status(201).json(createReply);
    } catch (error) {
      return next(error);
    }
  };

  // 문의 답변 상세조회
  getDetailReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const replyId = req.params.replyId;

      if (!replyId) {
        throw new BadRequestError('답변 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const detailReply = await this.inquiryService.getDetailReply(userId, replyId);
      return res.status(200).json(detailReply);
    } catch (error) {
      return next(error);
    }
  };

  // 문의 답변 수정
  updateReply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const replyId = req.params.replyId;

      if (!replyId) {
        throw new BadRequestError('답변 ID가 필요합니다.');
      }
      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const { content } = req.body;
      const data: CreateOrUpdateInquiryReplyDto = { content };

      const updateReply = await this.inquiryService.updateReply(userId, replyId, data);
      return res.status(200).json(updateReply);
    } catch (error) {
      return next(error);
    }
  };
}
