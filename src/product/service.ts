import { BadRequestError, NotFoundError } from 'src/common/errors/error-type';
import { productRepository } from './repository';
import {
  CreateProductDto,
  GetProductsParams,
  ProductInfoData,
  ProductListDto,
  UpdateProductDto,
  Stock,
} from './dto/create-product.dto';

export const productService = {
  // 상품 등록

  async createProduct(userId: string, body: CreateProductDto) {
    // seller 인지 확인
    const seller = await productRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new BadRequestError();
    }
    const { name, price, categoryName, stocks } = body;
    if (!name || !price || !categoryName || !stocks) {
      throw new BadRequestError();
    }
    const product = await productRepository.create({
      ...body,
      store: { connect: { id: seller.id } },
      discountStartTime: body.discountStartTime ? new Date(body.discountStartTime) : null,
      discountEndTime: body.discountEndTime ? new Date(body.discountEndTime) : null,
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
      ...product,
      storeName: product.store?.name,
    };
  },

  // 상품 목록 조회
  async getProducts(
    params: GetProductsParams
  ): Promise<{ list: ProductListDto[]; totalCount: number }> {
    const { list, totalCount } = await productRepository.findProducts(params);

    const now = new Date();
    const formattedList = list.map((item) => {
      const isDiscountActive =
        item.discountRate > 0 &&
        item.discountStartTime &&
        item.discountEndTime &&
        now >= new Date(item.discountStartTime) &&
        now <= new Date(item.discountEndTime);

      return {
        ...item,
        discountPrice: isDiscountActive ? item.discountPrice : item.price,
      };
    });

    return { list: formattedList, totalCount };
  },

  //  상품 수정

  async updateProduct(userId: string, productId: string, body: UpdateProductDto) {
    const seller = await productRepository.findSellerByUserId(userId);
    if (!seller) {
      throw new BadRequestError();
    }
    const product = await productRepository.findByProductId(productId);
    if (!product) {
      throw new NotFoundError();
    }

    const stocks = body.stocks?.map((s) => ({
      sizeId: s.sizeId.toString(),
      quantity: s.quantity,
    }));

    const updateProduct = await productRepository.updateWithStocks(
      productId,
      {
        name: body.name,
        price: body.price,
        content: body.content,
        image: body.image,
        discountRate: body.discountRate,
        discountStartTime: body.discountStartTime ? new Date(body.discountStartTime) : null,
        discountEndTime: body.discountEndTime ? new Date(body.discountEndTime) : null,
        isSoldOut: body.isSoldOut,
        Category: body.categoryName
          ? { upsert: { create: { name: body.categoryName }, update: { name: body.categoryName } } }
          : undefined,
      },
      stocks
    );

    return updateProduct;
  },

  // 상품 상세조회

  async getProductDetail(productId: string): Promise<ProductInfoData> {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError();

    const reviewsCount = product.Review.length;
    const reviewsRating = reviewsCount
      ? product.Review.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
      : 0;

    const reviewCount = {
      rate1Length: product.Review.filter((r) => r.rating === 1).length,
      rate2Length: product.Review.filter((r) => r.rating === 2).length,
      rate3Length: product.Review.filter((r) => r.rating === 3).length,
      rate4Length: product.Review.filter((r) => r.rating === 4).length,
      rate5Length: product.Review.filter((r) => r.rating === 5).length,
      sumScore: product.Review.reduce((sum, r) => sum + r.rating, 0),
    };

    const stocks: Stock[] = product.Stock.map((s) => ({
      id: s.id,
      quantity: s.quantity,
      size: { id: parseInt(s.size.id), name: s.size.name }, // 숫자 매핑
    }));

    return {
      id: product.id,
      name: product.name,
      image: product.image,
      content: product.content || '',
      createdAt: product.createAt.toISOString(),
      updatedAt: product.updateAt.toISOString(),
      reviewsCount,
      reviewsRating,
      reviews: reviewCount,
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
        ? [{ id: product.Category.id, name: product.Category.name }]
        : [],
      stocks,
      storeId: product.storeId!,
      storeName: product.Store?.name || '',
      store: product.Store ? { id: product.Store.id, name: product.Store.name } : undefined,
      price: Number(product.price),
      discountPrice: product.discountRate
        ? Number(product.price) * (1 - product.discountRate / 100)
        : Number(product.price),
      discountRate: product.discountRate || 0,
      discountStartTime: product.discountStartTime?.toISOString() || null,
      discountEndTime: product.discountEndTime?.toISOString() || null,
    };
  },
};
