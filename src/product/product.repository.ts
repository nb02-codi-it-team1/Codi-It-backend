import prisma from 'src/common/prisma/client';
import { InquiryStatus, Prisma } from '@prisma/client';
import { CreateInquiryDto } from './dto/inquiry.dto';
export const productRepository = {
  create: (data: Prisma.ProductCreateInput) =>
    prisma.product.create({
      data,
      include: {
        store: true,
        Stock: {
          include: {
            size: true,
          },
        },
        Category: true,
      },
    }),
  updateWithStocks: async (
    productId: string,
    data: Prisma.ProductUpdateInput,
    stocks?: { sizeId: number; quantity: number }[]
  ) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        ...data, // 기존 업데이트 데이터 포함
        Stock: stocks
          ? {
              deleteMany: { productId }, // 기존 재고 삭제
              create: stocks.map((stock) => ({
                size: { connect: { id: stock.sizeId } }, // FK 연결
                quantity: stock.quantity,
              })),
            }
          : undefined, // stocks가 없으면 건드리지 않음
      },
      include: {
        store: true,
        Stock: {
          include: {
            size: true,
          },
        },
        Category: true,
      },
    });
  },
  findById: (productId: string) =>
    prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
        Stock: { include: { size: true } },
        Review: true,
        Inquiry: { include: { InquiryReply: true, user: true } },
        Category: true,
      },
    }),
  findSellerByUserId: (userId: string) => prisma.store.findUnique({ where: { userId } }),
  findCategoryByName: (name: string) => prisma.category.findUnique({ where: { name } }),
  findByProductId: (productId: string) => prisma.product.findUnique({ where: { id: productId } }),
  findMany(
    where: Prisma.ProductWhereInput,
    orderBy: Prisma.ProductOrderByWithRelationInput,
    skip: number,
    take: number
  ) {
    return prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        name: true,
        image: true,
        price: true,
        discountRate: true,
        discountStartTime: true,
        discountEndTime: true,
        isSoldOut: true,
        createdAt: true,
        updatedAt: true,
        storeId: true,
        store: true,
        Stock: true,
        Review: true,
        Category: true,
      },
    });
  },

  count(where: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },

  getSalesByProducts(productIds: string[]) {
    return prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { productId: { in: productIds } },
    });
  },
  delete: async (productId: string) => {
    return await prisma.product.delete({
      where: { id: productId },
    });
  },
  createInquiry: async (userId: string, productId: string, data: CreateInquiryDto) => {
    return prisma.inquiry.create({
      data: {
        userId,
        productId,
        title: data.title,
        content: data.content,
        status: InquiryStatus.WaitingAnswer,
        isSecret: data.isSecret ?? false,
      },
    });
  },
  getInquiries: async (productId: string) => {
    return prisma.inquiry.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        InquiryReply: {
          include: {
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
  findUsersWithProductAndSizeInCart: async (productId: string, sizeId: number) => {
    const cartItems = await prisma.cartItem.findMany({
      where: {
        productId: productId,
        sizeId: sizeId,
      },
      include: {
        cart: {
          select: {
            buyerId: true, // buyerId만 선택
          },
        },
      },
    });
    const userIds = cartItems.map((item) => item.cart.buyerId);
    const uniqueUserIds = [...new Set(userIds)];

    return uniqueUserIds;
  },
  findSellerIdByProductId: async (productId: string) => {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: {
          select: {
            userId: true,
          },
        },
      },
    });
    return product?.store?.userId || null;
  },
};
