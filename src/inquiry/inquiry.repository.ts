import prisma from 'src/common/prisma/client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { InquiryStatus, Prisma } from '@prisma/client';
import { UpdateInquiryDto, CreateOrUpdateInquiryReplyDto } from './dto/inquiry.dto';

export const inquiryRepository = {
  findInquiriesBySellerId: (
    sellerId: string,
    params: { skip: number; take: number; status?: InquiryStatus }
  ) => {
    return prisma.inquiry.findMany({
      where: {
        product: {
          store: {
            userId: sellerId, // sellerId 필터링
          },
        },
        ...(params.status ? { status: params.status } : {}),
      },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isSecret: true,
        status: true,
        content: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        InquiryReply: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  },

  findMyInquiryByUserId: (
    userId: string,
    params: { skip: number; take: number; status?: InquiryStatus }
  ) => {
    return prisma.inquiry.findMany({
      where: { userId, ...(params.status ? { status: params.status } : {}) },
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        isSecret: true,
        status: true,
        content: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            store: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    });
  },

  countInquiryByUserId: (userId: string, params: { status?: InquiryStatus }) => {
    return prisma.inquiry.count({
      where: {
        userId,
        ...(params.status ? { status: params.status } : {}),
      },
    });
  },

  countInquiriesBySellerId: (sellerId: string, params: { status?: InquiryStatus }) => {
    return prisma.inquiry.count({
      where: {
        product: {
          store: {
            userId: sellerId,
          },
        },
        ...(params.status ? { status: params.status } : {}),
      },
    });
  },

  findInquiryByInquiryId: (inquiryId: string) => {
    return prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        user: { select: { name: true } },
        InquiryReply: { include: { user: { select: { name: true } } } },
        product: { include: { store: { select: { userId: true } } } },
      },
    });
  },
  updateInquiry: (inquiryId: string, data: UpdateInquiryDto) => {
    return prisma.inquiry.update({
      where: { id: inquiryId },
      data,
    });
  },
  deleteInquiry: (inquiryId: string) => {
    return prisma.inquiry.delete({
      where: { id: inquiryId },
    });
  },
  createReply: (data: { inquiryId: string; userId: string; content: string }) => {
    return prisma.inquiryReply.create({
      data: {
        content: data.content,
        inquiry: { connect: { id: data.inquiryId } },
        user: { connect: { id: data.userId } },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  },
  updateInquiryStatus: (inquiryId: string, status: InquiryStatus) => {
    return prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status },
    });
  },

  findReplyByReplyId: (replyId: string) => {
    return prisma.inquiryReply.findUnique({
      where: { id: replyId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        inquiry: {
          include: {
            user: {
              select: { name: true },
            },
            product: {
              select: {
                store: {
                  select: { userId: true },
                },
              },
            },
            InquiryReply: {
              include: {
                user: { select: { name: true } }, // 답글 작성자 이름
              },
            },
          },
        },
      },
    });
  },
  updateReply: (replyId: string, body: CreateOrUpdateInquiryReplyDto) => {
    return prisma.inquiryReply.update({
      where: { id: replyId },
      data: {
        content: body.content,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  },
};
