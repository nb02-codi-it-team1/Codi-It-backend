import { BadRequestError, NotFoundError } from 'src/common/errors/error-type';
import { productRepository } from './repository';
import {
  CreateProductDto,
  GetProductsParams,
  DetailProductResponse,
  UpdateProductDto,
  CategoryType,
  ProductListResponse,
  ReviewDto,
} from './dto/create-product.dto';
import { Prisma } from '@prisma/client';

export const productService = {
  // 상품 등록

  async createProduct(userId: string, body: CreateProductDto): Promise<DetailProductResponse> {
    // seller 인지 확인
    const seller = await productRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new BadRequestError();
    }
    const {
      name,
      price,
      content,
      image,
      discountRate,
      discountStartTime,
      discountEndTime,
      categoryName,
      stocks,
    } = body;
    if (!name || !price || !categoryName || !stocks) {
      throw new BadRequestError();
    }
    const product = await productRepository.create({
      name,
      price,
      content,
      image,
      discountRate,
      discountStartTime: discountStartTime ? new Date(discountStartTime) : null,
      discountEndTime: discountEndTime ? new Date(discountEndTime) : null,
      store: { connect: { id: seller.id } },
      Category: {
        create: { name: categoryName },
      },
      Stock: {
        create: stocks.map((stock) => ({
          size: { connect: { id: stock.sizeId } },
          quantity: stock.quantity,
        })),
      },
    });
    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      reviewsRating: 0,
      reviewsCount: 0,
      reviews: [],
      inquiries: [],
      category: product.Category
        ? [{ id: product.Category.id, name: product.Category.name as CategoryType }]
        : [],
      stocks: product.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name }, // Size 타입 매핑
      })),
      storeId: product.storeId!,
      storeName: product.store?.name || '',
      price: Number(product.price),
      discountPrice: product.discountRate
        ? Number(product.price) * (1 - product.discountRate / 100)
        : Number(product.price),
      discountRate: product.discountRate || 0,
      discountStartTime: product.discountStartTime?.toISOString() || null,
      discountEndTime: product.discountEndTime?.toISOString() || null,
    };
  },

  // 상품 목록 조회
  async getProducts(params: GetProductsParams): Promise<ProductListResponse> {
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
    // 🔹 검색 조건(where) 생성
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
        some: { size: { is: { name: { contains: size, mode: 'insensitive' } } } },
      };
    }
    if (favoriteStore) where.storeId = favoriteStore;
    if (categoryName) where.Category = { name: categoryName };

    // 🔹 정렬 조건(orderBy)
    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sort) {
      case 'lowPrice':
        orderBy = { price: 'asc' };
        break;
      case 'highPrice':
        orderBy = { price: 'desc' };
        break;
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    // 🔹 Repository 호출
    const totalCount = await productRepository.count(where);
    const list = await productRepository.findMany(where, orderBy, (page - 1) * pageSize, pageSize);

    // 🔹 매출 정보
    const salesRaw = await productRepository.getSalesByProducts(list.map((p) => p.id));
    const salesMap: Record<string, number> = Object.fromEntries(
      salesRaw.map((s) => [s.productId, s._sum.quantity || 0])
    );

    // 🔹 DTO 변환 + 할인 계산
    const now = new Date();
    const formattedList = list.map((item) => {
      const price = Number(item.price);
      const discountRate = item.discountRate ?? 0;
      const isDiscountActive =
        discountRate > 0 &&
        item.discountStartTime &&
        item.discountEndTime &&
        now >= new Date(item.discountStartTime) &&
        now <= new Date(item.discountEndTime);
      return {
        id: item.id,
        storeId: item.storeId ?? '',
        storeName: item.store?.name || '',
        name: item.name,
        image: item.image,
        price,
        discountPrice: isDiscountActive ? Math.floor(price * (1 - discountRate / 100)) : price,
        discountRate,
        discountStartTime: item.discountStartTime ?? null,
        discountEndTime: item.discountEndTime ?? null,
        reviewsCount: item.Review?.length ?? 0,
        reviewsRating: item.Review?.length
          ? item.Review.reduce((sum, r) => sum + r.rating, 0) / item.Review.length
          : 0,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
        sales: salesMap[item.id] || 0,
        isSoldOut: item.isSoldOut ?? false,
      };
    });

    return { list: formattedList, totalCount };
  },

  //  상품 수정

  async updateProduct(
    userId: string,
    productId: string,
    body: UpdateProductDto
  ): Promise<DetailProductResponse> {
    const seller = await productRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new BadRequestError();
    }
    const product = await productRepository.findByProductId(productId);
    if (!product) {
      throw new NotFoundError();
    }
    const data = {
      name: body.name,
      price: body.price,
      content: body.content,
      image: body.image,
      discountRate: body.discountRate,
      discountStartTime: body.discountStartTime ? new Date(body.discountStartTime) : null,
      discountEndTime: body.discountEndTime ? new Date(body.discountEndTime) : null,
      isSoldOut: body.isSoldOut,

      // 카테고리 업데이트 (없으면 create, 있으면 update)
      Category: body.categoryName
        ? {
            upsert: {
              create: { name: body.categoryName },
              update: { name: body.categoryName },
            },
          }
        : undefined,
    };

    const stocks = body.stocks?.map((s) => ({
      sizeId: s.sizeId,
      quantity: s.quantity,
    }));
    const updatedProduct = await productRepository.updateWithStocks(productId, data, stocks);

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      image: updatedProduct.image,
      content: updatedProduct.content || '',
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString(),
      reviewsRating: 0, // 기본값 or 실제 계산
      reviewsCount: 0, // 기본값 or 실제 계산
      reviews: [], // 필요하다면 repo에서 Review join해서 계산
      inquiries: [], // 필요하다면 repo에서 Inquiry join
      category: updatedProduct.Category
        ? [{ id: updatedProduct.Category.id, name: updatedProduct.Category.name as CategoryType }]
        : [],
      stocks: updatedProduct.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name }, // name은 size 테이블 join 필요
      })),
      storeId: updatedProduct.storeId!,
      storeName: updatedProduct.store?.name || '',
      price: Number(updatedProduct.price),
      discountPrice: updatedProduct.discountRate
        ? Number(updatedProduct.price) * (1 - updatedProduct.discountRate / 100)
        : Number(updatedProduct.price),
      discountRate: updatedProduct.discountRate || 0,
      discountStartTime: updatedProduct.discountStartTime?.toISOString() || null,
      discountEndTime: updatedProduct.discountEndTime?.toISOString() || null,
    };
  },

  // 상품 상세조회

  async getProductDetail(productId: string): Promise<DetailProductResponse> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError();

    const reviewsCount = product.Review.length;
    const reviewsRating = reviewsCount
      ? product.Review.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
      : 0;

    const reviewCount: ReviewDto = {
      rate1Length: product.Review.filter((r) => r.rating === 1).length,
      rate2Length: product.Review.filter((r) => r.rating === 2).length,
      rate3Length: product.Review.filter((r) => r.rating === 3).length,
      rate4Length: product.Review.filter((r) => r.rating === 4).length,
      rate5Length: product.Review.filter((r) => r.rating === 5).length,
      sumScore: product.Review.reduce((sum, r) => sum + r.rating, 0),
    };
    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      reviewsCount,
      reviewsRating,
      reviews: [reviewCount],
      inquiries: product.Inquiry.map((i) => ({
        id: i.id,
        title: i.title,
        content: i.content,
        status: i.status,
        isSecret: i.isSecret,
        createdAt: i.createdAt.toISOString(),
        updatedAt: i.updatedAt.toISOString(),
        reply: i.InquiryReply
          ? {
              id: i.InquiryReply.id,
              content: i.InquiryReply.content,
              createdAt: i.InquiryReply.createdAt.toISOString(),
              updatedAt: i.InquiryReply.updatedAt.toISOString(),
              user: { id: i.user.id, name: i.user.name },
            }
          : null,
      })),
      category: product.Category // 배열로 감싸기
        ? [{ id: product.Category.id, name: product.Category.name as CategoryType }]
        : [],
      stocks: product.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name }, // Size 타입 매핑
      })),
      storeId: product.storeId!,
      storeName: product.store?.name || '',
      price: Number(product.price),
      discountPrice: product.discountRate
        ? Number(product.price) * (1 - product.discountRate / 100)
        : Number(product.price),
      discountRate: product.discountRate || 0,
      discountStartTime: product.discountStartTime?.toISOString() || null,
      discountEndTime: product.discountEndTime?.toISOString() || null,
    };
  },

  async deleteProduct(userId: string, productId: string) {
    const seller = await productRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new BadRequestError();
    }

    const product = await productRepository.findByProductId(productId);
    if (!product) {
      throw new NotFoundError();
    }

    const deleteProduct = await productRepository.delete(productId);
    return deleteProduct;
  },
};
