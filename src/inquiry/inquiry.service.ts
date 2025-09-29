import {
  getMyInquiriesParams,
  InquiryReplyResponse,
  UpdateInquiryDto,
  CreateOrUpdateInquiryReplyDto,
} from './dto/inquiry.dto';
import { inquiryRepository } from './inquiry.repository';
import { InquiryList } from '../inquiry/dto/inquiry.dto';
import { InquiriesResponse, InquiryResponse } from 'src/product/dto/inquiry.dto';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from 'src/common/errors/error-type';
import { InquiryStatus } from '@prisma/client';

export const inquiryService = {
  async getMyInquiries(userId: string, params: getMyInquiriesParams): Promise<InquiryList> {
    const skip = (params.page! - 1) * params.pageSize!;
    const take = params.pageSize!;

    const [list, totalCount] = await Promise.all([
      inquiryRepository.findMyInquiryByUserId(userId, { skip, take, status: params.status }),
      inquiryRepository.countInquiryByUserId(userId, { status: params.status }),
    ]);

    return { list, totalCount };
  },

  async getDetailInquiry(userId: string, inquiryId: string): Promise<InquiriesResponse> {
    const inquiry = await inquiryRepository.findInquiryByInquiryId(inquiryId);
    if (!inquiry) {
      throw new NotFoundError();
    }

    const isSecret = inquiry.isSecret === true;

    if (isSecret) {
      const isAuthor = inquiry.userId === userId;
      const isSeller = inquiry.product.store.userId === userId;
      if (!isAuthor && !isSeller) {
        throw new UnauthorizedError();
      }
    }

    return {
      id: inquiry.id,
      userId: inquiry.userId,
      productId: inquiry.productId,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      isSecret: inquiry.isSecret,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      user: {
        name: inquiry.user.name,
      },
      reply: inquiry.InquiryReply
        ? {
            id: inquiry.InquiryReply.id,
            content: inquiry.InquiryReply.content,
            createdAt: inquiry.InquiryReply.createdAt,
            updatedAt: inquiry.InquiryReply.updatedAt,
            user: {
              name: inquiry.InquiryReply.user.name,
            },
          }
        : null,
    };
  },

  async updateInquiry(
    userId: string,
    inquiryId: string,
    data: UpdateInquiryDto
  ): Promise<InquiryResponse> {
    const inquiry = await inquiryRepository.findInquiryByInquiryId(inquiryId);
    if (!inquiry) {
      throw new NotFoundError();
    }

    const isAuthor = inquiry.userId === userId;
    if (!isAuthor) {
      throw new ForbiddenError();
    }

    if (inquiry.status === InquiryStatus.CompletedAnswer) {
      throw new BadRequestError();
    }

    const updateInquiry = await inquiryRepository.updateInquiry(inquiryId, data);
    return {
      id: updateInquiry.id,
      userId: updateInquiry.userId,
      productId: updateInquiry.productId,
      title: updateInquiry.title,
      content: updateInquiry.content,
      status: updateInquiry.status,
      isSecret: updateInquiry.isSecret,
      createdAt: updateInquiry.createdAt,
      updatedAt: updateInquiry.updatedAt,
    };
  },

  async deleteInquiry(userId: string, inquiryId: string): Promise<InquiryResponse> {
    const inquiry = await inquiryRepository.findInquiryByInquiryId(inquiryId);
    if (!inquiry) {
      throw new NotFoundError();
    }

    const isAuthor = inquiry.userId === userId;
    if (!isAuthor) {
      throw new ForbiddenError();
    }

    const deleteInquiry = await inquiryRepository.deleteInquiry(inquiryId);
    return {
      id: deleteInquiry.id,
      userId: deleteInquiry.userId,
      productId: deleteInquiry.productId,
      title: deleteInquiry.title,
      content: deleteInquiry.content,
      status: deleteInquiry.status,
      isSecret: deleteInquiry.isSecret,
      createdAt: deleteInquiry.createdAt,
      updatedAt: deleteInquiry.updatedAt,
    };
  },

  async postInquiryReply(
    userId: string,
    inquiryId: string,
    body: CreateOrUpdateInquiryReplyDto
  ): Promise<InquiryReplyResponse> {
    const inquiry = await inquiryRepository.findInquiryByInquiryId(inquiryId);
    if (!inquiry) {
      throw new NotFoundError();
    }

    const isSeller = inquiry.product.store.userId === userId;
    if (!isSeller) {
      throw new ForbiddenError();
    }

    const { content } = body;
    if (!content) {
      throw new BadRequestError();
    }

    const createReply = await inquiryRepository.createReply({
      inquiryId,
      userId,
      content,
    });
    await inquiryRepository.updateInquiryStatus(inquiryId, 'CompletedAnswer');

    return {
      id: createReply.id,
      inquiryId: createReply.inquiryId,
      userId: createReply.userId,
      content: createReply.content,
      createdAt: createReply.createdAt.toISOString(),
      updatedAt: createReply.updatedAt.toISOString(),
      user: {
        id: createReply.user.id,
        name: createReply.user.name,
      },
    };
  },

  async getDetailReply(userId: string, replyId: string): Promise<InquiriesResponse> {
    const existReply = await inquiryRepository.findReplyByReplyId(replyId);
    if (!existReply) throw new NotFoundError();

    const inquiry = existReply.inquiry;

    if (inquiry.isSecret) {
      const isAuthor = inquiry.userId === userId;
      const isSeller = inquiry.product.store.userId === userId;
      if (!isAuthor && !isSeller) throw new UnauthorizedError();
    }

    return {
      id: inquiry.id,
      userId: inquiry.userId,
      productId: inquiry.productId,
      title: inquiry.title,
      content: inquiry.content,
      status: inquiry.status,
      isSecret: inquiry.isSecret,
      createdAt: inquiry.createdAt,
      updatedAt: inquiry.updatedAt,
      user: {
        name: inquiry.user.name,
      },
      reply: {
        id: existReply.id,
        content: existReply.content,
        createdAt: existReply.createdAt,
        updatedAt: existReply.updatedAt,
        user: {
          name: existReply.user.name,
        },
      },
    };
  },
  async updateReply(
    userId: string,
    replyId: string,
    body: CreateOrUpdateInquiryReplyDto
  ): Promise<InquiryReplyResponse> {
    const reply = await inquiryRepository.findReplyByReplyId(replyId);
    if (!reply) {
      throw new NotFoundError();
    }

    const isSeller = reply.inquiry.product.store.userId === userId;
    if (!isSeller) {
      throw new ForbiddenError();
    }

    const { content } = body;
    if (!content) {
      throw new BadRequestError();
    }
    const updateReply = await inquiryRepository.updateReply(replyId, body);
    return {
      id: updateReply.id,
      inquiryId: updateReply.inquiryId,
      userId: updateReply.userId,
      content: updateReply.content,
      createdAt: updateReply.createdAt.toISOString(),
      updatedAt: updateReply.updatedAt.toISOString(),
      user: {
        id: updateReply.user.id,
        name: updateReply.user.name,
      },
    };
  },
};
