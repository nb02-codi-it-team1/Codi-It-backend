// import prisma from 'src/common/prisma/client';
// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// import { InquiryStatus, Prisma } from '@prisma/client';
// import { UpdateInquiryDto, CreateOrUpdateInquiryReplyDto } from './dto/inquiry.dto';

// export const inquiryRepository = {
//   findInquiriesBySellerId: (
//     sellerId: string,
//     params: { skip: number; take: number; status?: InquiryStatus }
//   ) => {
//     return prisma.inquiry.findMany({
//       where: {
//         product: {
//           store: {
//             userId: sellerId, // sellerId 필터링
//           },
//         },
//         ...(params.status ? { status: params.status } : {}),
//       },
//       skip: params.skip,
//       take: params.take,
//       orderBy: { createdAt: 'desc' },
//       select: {
//         id: true,
//         title: true,
//         isSecret: true,
//         status: true,
//         content: true,
//         createdAt: true,
//         product: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//             store: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         },
//         user: {
//           select: {
//             name: true,
//           },
//         },
//         InquiryReply: {
//           select: {
//             id: true,
//             content: true,
//             createdAt: true,
//             updatedAt: true,
//             user: {
//               select: {
//                 name: true,
//               },
//             },
//           },
//         },
//       },
//     });
//   },

//   findMyInquiryByUserId: (
//     userId: string,
//     params: { skip: number; take: number; status?: InquiryStatus }
//   ) => {
//     return prisma.inquiry.findMany({
//       where: { userId, ...(params.status ? { status: params.status } : {}) },
//       skip: params.skip,
//       take: params.take,
//       orderBy: { createdAt: 'desc' },
//       select: {
//         id: true,
//         title: true,
//         isSecret: true,
//         status: true,
//         content: true,
//         createdAt: true,
//         product: {
//           select: {
//             id: true,
//             name: true,
//             image: true,
//             store: {
//               select: {
//                 id: true,
//                 name: true,
//               },
//             },
//           },
//         },
//         user: {
//           select: {
//             name: true,
//           },
//         },
//       },
//     });
//   },

//   countInquiryByUserId: (userId: string, params: { status?: InquiryStatus }) => {
//     return prisma.inquiry.count({
//       where: {
//         userId,
//         ...(params.status ? { status: params.status } : {}),
//       },
//     });
//   },

//   countInquiriesBySellerId: (sellerId: string, params: { status?: InquiryStatus }) => {
//     return prisma.inquiry.count({
//       where: {
//         product: {
//           store: {
//             userId: sellerId,
//           },
//         },
//         ...(params.status ? { status: params.status } : {}),
//       },
//     });
//   },

//   findInquiryByInquiryId: (inquiryId: string) => {
//     return prisma.inquiry.findUnique({
//       where: { id: inquiryId },
//       include: {
//         user: { select: { name: true } },
//         InquiryReply: { include: { user: { select: { name: true } } } },
//         product: { include: { store: { select: { userId: true } } } },
//       },
//     });
//   },
//   updateInquiry: (inquiryId: string, data: UpdateInquiryDto) => {
//     return prisma.inquiry.update({
//       where: { id: inquiryId },
//       data,
//     });
//   },
//   deleteInquiry: (inquiryId: string) => {
//     return prisma.inquiry.delete({
//       where: { id: inquiryId },
//     });
//   },
//   createReply: (data: { inquiryId: string; userId: string; content: string }) => {
//     return prisma.inquiryReply.create({
//       data: {
//         content: data.content,
//         inquiry: { connect: { id: data.inquiryId } },
//         user: { connect: { id: data.userId } },
//       },
//       include: {
//         user: { select: { id: true, name: true } },
//       },
//     });
//   },
//   updateInquiryStatus: (inquiryId: string, status: InquiryStatus) => {
//     return prisma.inquiry.update({
//       where: { id: inquiryId },
//       data: { status },
//     });
//   },

//   findReplyByReplyId: (replyId: string) => {
//     return prisma.inquiryReply.findUnique({
//       where: { id: replyId },
//       include: {
//         user: {
//           select: {
//             name: true,
//           },
//         },
//         inquiry: {
//           include: {
//             user: {
//               select: { name: true },
//             },
//             product: {
//               select: {
//                 store: {
//                   select: { userId: true },
//                 },
//               },
//             },
//             InquiryReply: {
//               include: {
//                 user: { select: { name: true } }, // 답글 작성자 이름
//               },
//             },
//           },
//         },
//       },
//     });
//   },
//   updateReply: (replyId: string, body: CreateOrUpdateInquiryReplyDto) => {
//     return prisma.inquiryReply.update({
//       where: { id: replyId },
//       data: {
//         content: body.content,
//       },
//       include: { user: { select: { id: true, name: true } } },
//     });
//   },
// };

import { InquiryStatus, Prisma, PrismaClient } from '@prisma/client';
import { UpdateInquiryDto, CreateOrUpdateInquiryReplyDto } from './dto/inquiry.dto';

export default class InquiryRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  /**
   * 판매자 ID로 문의 목록을 조회합니다.
   */
  async findInquiriesBySellerId(
    sellerId: string,
    params: { skip: number; take: number; status?: InquiryStatus }
  ) {
    return this.prisma.inquiry.findMany({
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
  }

  /**
   * 유저 ID로 자신의 문의 목록을 조회합니다.
   */
  async findMyInquiryByUserId(
    userId: string,
    params: { skip: number; take: number; status?: InquiryStatus }
  ) {
    return this.prisma.inquiry.findMany({
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
  }

  /**
   * 유저 ID로 자신의 문의 개수를 계산합니다.
   */
  async countInquiryByUserId(userId: string, params: { status?: InquiryStatus }) {
    return this.prisma.inquiry.count({
      where: {
        userId,
        ...(params.status ? { status: params.status } : {}),
      },
    });
  }

  /**
   * 판매자 ID로 판매자에게 들어온 문의 개수를 계산합니다.
   */
  async countInquiriesBySellerId(sellerId: string, params: { status?: InquiryStatus }) {
    return this.prisma.inquiry.count({
      where: {
        product: {
          store: {
            userId: sellerId,
          },
        },
        ...(params.status ? { status: params.status } : {}),
      },
    });
  }

  /**
   * 문의 ID로 특정 문의를 조회합니다.
   */
  async findInquiryByInquiryId(inquiryId: string) {
    return this.prisma.inquiry.findUnique({
      where: { id: inquiryId },
      include: {
        user: { select: { name: true } },
        InquiryReply: { include: { user: { select: { name: true } } } },
        product: { include: { store: { select: { userId: true } } } },
      },
    });
  }

  /**
   * 문의를 수정합니다.
   */
  async updateInquiry(inquiryId: string, data: UpdateInquiryDto) {
    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data,
    });
  }

  /**
   * 문의를 삭제합니다.
   */
  async deleteInquiry(inquiryId: string) {
    return this.prisma.inquiry.delete({
      where: { id: inquiryId },
    });
  }

  /**
   * 문의에 대한 답글을 생성합니다.
   */
  async createReply(data: { inquiryId: string; userId: string; content: string }) {
    return this.prisma.inquiryReply.create({
      data: {
        content: data.content,
        inquiry: { connect: { id: data.inquiryId } },
        user: { connect: { id: data.userId } },
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  }

  /**
   * 문의 상태를 업데이트합니다.
   */
  async updateInquiryStatus(inquiryId: string, status: InquiryStatus) {
    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: { status },
    });
  }

  /**
   * 답글 ID로 특정 답글을 조회합니다.
   */
  async findReplyByReplyId(replyId: string) {
    return this.prisma.inquiryReply.findUnique({
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
  }

  /**
   * 답글을 수정합니다.
   */
  async updateReply(replyId: string, body: CreateOrUpdateInquiryReplyDto) {
    return this.prisma.inquiryReply.update({
      where: { id: replyId },
      data: {
        content: body.content,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }
}
