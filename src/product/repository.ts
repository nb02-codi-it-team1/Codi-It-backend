import prisma from 'src/common/prisma/client';
import { Prisma } from '@prisma/client';
import { GetProductsParams } from './dto/create-product.dto';
import { ProductListDto } from './dto/create-product.dto';
export const productRepository = {
  create: (data: Prisma.ProductCreateInput) =>
    prisma.product.create({
      data,
      include: {
        store: true,
        Stock: true,
        Category: true,
      },
    }),
  updateWithStocks: async (
    productId: string,
    data: Prisma.ProductUpdateInput,
    stocks?: { sizeId: string; quantity: number }[]
  ) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        ...data, // 기존 업데이트 데이터 포함
        Stock: stocks
          ? {
              deleteMany: { productId }, // 기존 재고 삭제
              create: stocks.map((stock) => ({
                size: { connect: { id: stock.sizeId.toString() } }, // FK 연결
                quantity: stock.quantity,
              })),
            }
          : undefined, // stocks가 없으면 건드리지 않음
      },
      include: {
        store: true,
        Stock: true,
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
  findByProductId: (productId: string) => prisma.product.findUnique({ where: { id: productId } }),
  findProducts: async (params: GetProductsParams) => {
    const {
      page = 1,
      pageSize = 16,
      search,
      sort,
      priceMin,
      priceMax,
      size,
      favoriteStore,
      categoryName,
    } = params;

    const where: Prisma.ProductWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (priceMin !== undefined || (priceMax !== undefined && priceMax !== 0)) {
      where.price = {
        ...(priceMin !== undefined ? { gte: priceMin } : {}),
        ...(priceMax !== undefined && priceMax !== 0 ? { lte: priceMax } : {}),
      };
    }
    if (size) {
      where.Stock = {
        some: {
          size: {
            is: {
              name: {
                contains: size,
                mode: 'insensitive',
              },
            },
          },
        },
      };
    }
    if (favoriteStore) where.storeId = favoriteStore;
    if (categoryName) where.Category = { name: categoryName };

    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sort) {
      case 'lowPrice':
        orderBy = { price: 'asc' };
        break;
      case 'highPrice':
        orderBy = { price: 'desc' };
        break;
      case 'recent':
        orderBy = { createAt: 'desc' };
        break;
      default:
        orderBy = { createAt: 'desc' };
    }

    const totalCount = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      include: {
        store: true,
        Stock: true,
        Review: true,
        Category: true,
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    const salesMapRaw = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { productId: { in: products.map((p) => p.id) } },
    });
    const salesMap: Record<string, number> = Object.fromEntries(
      salesMapRaw.map((s) => [s.productId, s._sum.quantity || 0])
    );

    // DTO 변환 + 후처리 정렬
    const list: ProductListDto[] = products.map((p) => {
      const reviewsCount = p.Review.length;
      const reviewsRating =
        reviewsCount > 0 ? p.Review.reduce((sum, r) => sum + r.rating, 0) / reviewsCount : 0;

      const sales = salesMap[p.id] || 0;

      const discountPrice = p.discountRate
        ? Number(p.price) * (1 - p.discountRate / 100)
        : Number(p.price);

      return {
        id: p.id,
        storeId: p.storeId!,
        storeName: p.store?.name || '',
        name: p.name,
        image: p.image,
        price: Number(p.price),
        discountPrice,
        discountRate: p.discountRate || 0,
        discountStartTime: p.discountStartTime,
        discountEndTime: p.discountEndTime,
        reviewsCount,
        reviewsRating,
        createdAt: p.createAt.toISOString(),
        updatedAt: p.updateAt.toISOString(),
        sales,
        isSoldOut: p.isSoldOut,
      };
    });

    // 후처리 정렬: mostReviewed, highRating, salesRanking
    if (sort === 'mostReviewed') {
      list.sort((a, b) => b.reviewsCount - a.reviewsCount);
    } else if (sort === 'highRating') {
      list.sort((a, b) => b.reviewsRating - a.reviewsRating);
    } else if (sort === 'salesRanking') {
      list.sort((a, b) => b.sales - a.sales);
    }

    return {
      list,
      totalCount,
    };
  },
};
