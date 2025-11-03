// import { BadRequestError, NotFoundError } from '../common/errors/error-type';
// import { productRepository } from './product.repository';
// import {
//   CreateProductDto,
//   GetProductsParams,
//   DetailProductResponse,
//   UpdateProductDto,
//   CategoryType,
//   ProductListResponse,
//   ReviewDto,
// } from './dto/product.dto';
// import { NotificationType, Prisma, PrismaClient } from '@prisma/client';
// import { CreateInquiryDto, InquiriesListResponse, InquiryResponse } from './dto/inquiry.dto';
// import { NotificationRepository } from 'src/notification/notification.repository';
// import { NotificationService } from 'src/notification/notification.service';
// import { CreateNotificationDto } from 'src/notification/dto/create.dto';
// import StoreRepository from 'src/stores/stores.repository';

// const prisma = new PrismaClient();
// const notificationRepository = new NotificationRepository(prisma);
// const storeRepository = new StoreRepository(prisma);
// const notificationService = new NotificationService(notificationRepository);

// export const productService = {
//   // 상품 등록

//   async createProduct(userId: string, body: CreateProductDto): Promise<DetailProductResponse> {
//     // seller 인지 확인, 스토어 존재여부
//     const seller = await productRepository.findSellerByUserId(userId);
//     if (!seller) {
//       throw new NotFoundError();
//     }
//     const {
//       name,
//       price,
//       content,
//       image,
//       discountRate,
//       discountStartTime,
//       discountEndTime,
//       categoryName,
//       stocks,
//     } = body;
//     if (!name || !price || !categoryName || !stocks) {
//       throw new BadRequestError();
//     }

//     // categoryName으로 id 찾기
//     const category = await productRepository.findCategoryByName(categoryName.toUpperCase());
//     if (!category) {
//       throw new NotFoundError();
//     }

//     const product = await productRepository.create({
//       name,
//       price,
//       content,
//       image,
//       discountRate,
//       discountStartTime: discountStartTime ? new Date(discountStartTime) : null,
//       discountEndTime: discountEndTime ? new Date(discountEndTime) : null,
//       store: { connect: { id: seller.id } },
//       Category: {
//         connect: { id: category.id },
//       },
//       Stock: {
//         create: stocks.map((stock) => ({
//           size: { connect: { id: stock.sizeId } },
//           quantity: stock.quantity,
//         })),
//       },
//     });

//     await storeRepository.updateProductCount(seller.id);

//     return {
//       id: product.id,
//       name: product.name,
//       image: product.image,
//       content: product.content || '',
//       createdAt: product.createdAt.toISOString(),
//       updatedAt: product.updatedAt.toISOString(),
//       reviewsRating: 0,
//       reviewsCount: 0,
//       reviews: [],
//       inquiries: [],
//       category: product.Category
//         ? { id: product.Category.id, name: product.Category.name as CategoryType }
//         : { id: '', name: 'UNKNOWN' as CategoryType },
//       stocks: product.Stock.map((s) => ({
//         id: s.id,
//         productId: s.productId,
//         quantity: s.quantity,
//         size: { id: s.sizeId, name: s.size.name }, // Size 타입 매핑
//       })),
//       storeId: product.storeId!,
//       storeName: product.store?.name || '',
//       price: Number(product.price),
//       discountPrice: product.discountRate
//         ? Number(product.price) * (1 - product.discountRate / 100)
//         : Number(product.price),
//       discountRate: product.discountRate || 0,
//       discountStartTime: product.discountStartTime?.toISOString() || null,
//       discountEndTime: product.discountEndTime?.toISOString() || null,
//     };
//   },

//   // 상품 목록 조회
//   async getProducts(params: GetProductsParams): Promise<ProductListResponse> {
//     const {
//       page = 1,
//       pageSize = 16,
//       search,
//       sort,
//       priceMin,
//       priceMax,
//       size,
//       favoriteStore,
//       categoryName,
//     } = params;
//     // 🔹 검색 조건(where) 생성
//     const where: Prisma.ProductWhereInput = {};
//     if (search) where.name = { contains: search, mode: 'insensitive' };
//     if (priceMin !== undefined || (priceMax !== undefined && priceMax !== 0)) {
//       where.price = {
//         ...(priceMin !== undefined ? { gte: priceMin } : {}),
//         ...(priceMax !== undefined && priceMax !== 0 ? { lte: priceMax } : {}),
//       };
//     }
//     if (size) {
//       where.Stock = {
//         some: { size: { is: { name: { contains: size, mode: 'insensitive' } } } },
//       };
//     }
//     if (favoriteStore) where.storeId = favoriteStore;
//     if (categoryName) where.Category = { name: categoryName.toUpperCase() };

//     // 🔹 정렬 조건(orderBy)
//     let orderBy: Prisma.ProductOrderByWithRelationInput = {};
//     switch (sort) {
//       case 'lowPrice':
//         orderBy = { price: 'asc' };
//         break;
//       case 'highPrice':
//         orderBy = { price: 'desc' };
//         break;
//       case 'recent':
//         orderBy = { createdAt: 'desc' };
//         break;
//       default:
//         orderBy = { createdAt: 'desc' };
//     }

//     // 🔹 Repository 호출
//     const totalCount = await productRepository.count(where);
//     const list = await productRepository.findMany(where, orderBy, (page - 1) * pageSize, pageSize);

//     // 🔹 매출 정보
//     const salesRaw = await productRepository.getSalesByProducts(list.map((p) => p.id));
//     const salesMap: Record<string, number> = Object.fromEntries(
//       salesRaw.map((s) => [s.productId, s._sum.quantity || 0])
//     );

//     // 🔹 DTO 변환 + 할인 계산
//     const now = new Date();
//     const formattedList = list.map((item) => {
//       const price = Number(item.price);
//       const discountRate = item.discountRate ?? 0;
//       const isDiscountActive =
//         discountRate > 0 &&
//         item.discountStartTime &&
//         item.discountEndTime &&
//         now >= new Date(item.discountStartTime) &&
//         now <= new Date(item.discountEndTime);
//       return {
//         id: item.id,
//         storeId: item.storeId ?? '',
//         storeName: item.store?.name || '',
//         name: item.name,
//         image: item.image,
//         price,
//         discountPrice: isDiscountActive ? Math.floor(price * (1 - discountRate / 100)) : price,
//         discountRate,
//         discountStartTime: item.discountStartTime ?? null,
//         discountEndTime: item.discountEndTime ?? null,
//         reviewsCount: item.Review?.length ?? 0,
//         reviewsRating: item.Review?.length
//           ? item.Review.reduce((sum, r) => sum + r.rating, 0) / item.Review.length
//           : 0,
//         createdAt: item.createdAt.toISOString(),
//         updatedAt: item.updatedAt.toISOString(),
//         sales: salesMap[item.id] || 0,
//         isSoldOut: item.isSoldOut ?? false,
//       };
//     });

//     return { list: formattedList, totalCount };
//   },

//   //  상품 수정

//   async updateProduct(
//     userId: string,
//     productId: string,
//     body: UpdateProductDto
//   ): Promise<DetailProductResponse> {
//     const seller = await productRepository.findSellerByUserId(userId);
//     if (!seller) {
//       throw new BadRequestError();
//     }
//     const product = await productRepository.findById(productId);
//     if (!product) {
//       throw new NotFoundError();
//     }
//     const previousStocks = product.Stock;

//     let categoryConnect;
//     if (body.categoryName) {
//       const category = await productRepository.findCategoryByName(body.categoryName.toUpperCase());
//       if (!category) throw new NotFoundError();
//       categoryConnect = { connect: { id: category.id } };
//     } else if (product.Category) {
//       categoryConnect = { connect: { id: product.Category.id } };
//     }
//     const data: Prisma.ProductUpdateInput = {
//       name: body.name ?? product.name,
//       price: body.price ?? product.price,
//       content: body.content ?? product.content,
//       image: body.image ?? product.image,
//       discountRate: body.discountRate ?? product.discountRate,
//       discountStartTime: body.discountStartTime
//         ? new Date(body.discountStartTime)
//         : product.discountStartTime,
//       discountEndTime: body.discountEndTime
//         ? new Date(body.discountEndTime)
//         : product.discountEndTime,
//       isSoldOut: body.isSoldOut ?? product.isSoldOut,
//       Category: categoryConnect,
//     };

//     const stocks = body.stocks?.map((s) => ({
//       sizeId: s.sizeId,
//       quantity: s.quantity,
//     }));
//     const updatedProduct = await productRepository.updateWithStocks(productId, data, stocks);
//     /*
//      * notification 추가
//      * 사이즈별 품절 알림
//      * 품절 상태 변경 확인
//      * 품절이 아니었으나 품절되었다면 알림 전송
//      */

//     // --- 알람 로직 시작 ---
//     const sellerId = seller.id;

//     for (const updatedStock of updatedProduct.Stock) {
//       // 이전에는 재고가 있었으나 이후에 0이 된 경우에만 알람을 보내도록 설정
//       const previousStock = previousStocks.find((s) => s.sizeId === updatedStock.sizeId);
//       if (previousStock && previousStock.quantity > 0 && updatedStock.quantity === 0) {
//         const sizeName = updatedStock.size.name;

//         const usersToNotify = await productRepository.findUsersWithProductAndSizeInCart(
//           productId,
//           updatedStock.sizeId
//         );

//         for (const buyerId of usersToNotify) {
//           const buyerDto: CreateNotificationDto = {
//             content: `장바구니에 담은 상품 '${updatedProduct.name} (${sizeName})'이 품절되었습니다.`,
//             type: NotificationType.BUYER_SOLD_OUT,
//             size: sizeName,
//           };
//           notificationService.createAndSendNotification(buyerId, buyerDto);
//         }

//         const sellerDto: CreateNotificationDto = {
//           content: `${updatedProduct.name}의 ${sizeName}사이즈가 품절되었습니다.`,
//           type: NotificationType.SELLER_SOLD_OUT,
//           size: sizeName,
//         };
//         notificationService.createAndSendNotification(sellerId, sellerDto);
//       }

//       if (previousStock && previousStock.quantity === 0 && updatedStock.quantity > 0) {
//         const sizeName = updatedStock.size.name;
//         const usersToNotify = await productRepository.findUsersWithProductAndSizeInCart(
//           productId,
//           updatedStock.sizeId
//         );

//         for (const buyerId of usersToNotify) {
//           const buyerDto: CreateNotificationDto = {
//             content: `상품 '${updatedProduct.name} (${sizeName})'이 재입고 되었습니다.`,
//             type: NotificationType.BUYER_RESTOCKED,
//             size: sizeName,
//           };
//           notificationService.createAndSendNotification(buyerId, buyerDto);
//         }
//       }
//     }
//     // --- 알람 로직 종료 ---

//     return {
//       id: updatedProduct.id,
//       name: updatedProduct.name,
//       image: updatedProduct.image,
//       content: updatedProduct.content || '',
//       createdAt: updatedProduct.createdAt.toISOString(),
//       updatedAt: updatedProduct.updatedAt.toISOString(),
//       reviewsRating: 0, // 기본값 or 실제 계산
//       reviewsCount: 0, // 기본값 or 실제 계산
//       reviews: [], // 필요하다면 repo에서 Review join해서 계산
//       inquiries: [], // 필요하다면 repo에서 Inquiry join
//       category: updatedProduct.Category
//         ? { id: updatedProduct.Category.id, name: updatedProduct.Category.name as CategoryType }
//         : { id: '', name: 'UNKNOWN' as CategoryType },
//       stocks: updatedProduct.Stock.map((s) => ({
//         id: s.id,
//         productId: s.productId,
//         quantity: s.quantity,
//         size: { id: s.sizeId, name: s.size.name }, // name은 size 테이블 join 필요
//       })),
//       storeId: updatedProduct.storeId!,
//       storeName: updatedProduct.store?.name || '',
//       price: Number(updatedProduct.price),
//       discountPrice: updatedProduct.discountRate
//         ? Number(updatedProduct.price) * (1 - updatedProduct.discountRate / 100)
//         : Number(updatedProduct.price),
//       discountRate: updatedProduct.discountRate || 0,
//       discountStartTime: updatedProduct.discountStartTime?.toISOString() || null,
//       discountEndTime: updatedProduct.discountEndTime?.toISOString() || null,
//     };
//   },

//   // 상품 상세조회

//   async getProductDetail(productId: string): Promise<DetailProductResponse> {
//     const product = await productRepository.findById(productId);
//     if (!product) throw new NotFoundError();

//     const reviewsCount = product.Review.length;
//     const reviewsRating = reviewsCount
//       ? product.Review.reduce((sum, r) => sum + r.rating, 0) / reviewsCount
//       : 0;

//     const reviewCount: ReviewDto = {
//       rate1Length: product.Review.filter((r) => r.rating === 1).length,
//       rate2Length: product.Review.filter((r) => r.rating === 2).length,
//       rate3Length: product.Review.filter((r) => r.rating === 3).length,
//       rate4Length: product.Review.filter((r) => r.rating === 4).length,
//       rate5Length: product.Review.filter((r) => r.rating === 5).length,
//       sumScore: product.Review.reduce((sum, r) => sum + r.rating, 0),
//     };
//     return {
//       id: product.id,
//       name: product.name,
//       image: product.image,
//       content: product.content || '',
//       createdAt: product.createdAt.toISOString(),
//       updatedAt: product.updatedAt.toISOString(),
//       reviewsCount,
//       reviewsRating,
//       reviews: [reviewCount],
//       inquiries: product.Inquiry.map((i) => ({
//         id: i.id,
//         title: i.title,
//         content: i.content,
//         status: i.status,
//         isSecret: i.isSecret,
//         createdAt: i.createdAt.toISOString(),
//         updatedAt: i.updatedAt.toISOString(),
//         reply: i.InquiryReply
//           ? {
//               id: i.InquiryReply.id,
//               content: i.InquiryReply.content,
//               createdAt: i.InquiryReply.createdAt.toISOString(),
//               updatedAt: i.InquiryReply.updatedAt.toISOString(),
//               user: { id: i.user.id, name: i.user.name },
//             }
//           : null,
//       })),
//       category: product.Category // 배열로 감싸기
//         ? { id: product.Category.id, name: product.Category.name as CategoryType }
//         : { id: '', name: 'UNKNOWN' as CategoryType },
//       stocks: product.Stock.map((s) => ({
//         id: s.id,
//         productId: s.productId,
//         quantity: s.quantity,
//         size: { id: s.sizeId, name: s.size.name }, // Size 타입 매핑
//       })),
//       storeId: product.storeId!,
//       storeName: product.store?.name || '',
//       price: Number(product.price),
//       discountPrice: product.discountRate
//         ? Number(product.price) * (1 - product.discountRate / 100)
//         : Number(product.price),
//       discountRate: product.discountRate || 0,
//       discountStartTime: product.discountStartTime?.toISOString() || null,
//       discountEndTime: product.discountEndTime?.toISOString() || null,
//     };
//   },

//   async deleteProduct(userId: string, productId: string) {
//     const seller = await productRepository.findSellerByUserId(userId);
//     if (!seller) {
//       throw new BadRequestError();
//     }

//     const product = await productRepository.findByProductId(productId);
//     if (!product) {
//       throw new NotFoundError();
//     }
//     const deleteProduct = await productRepository.delete(productId);
//     await storeRepository.updateProductCount(seller.id);

//     return deleteProduct;
//   },

//   // 상품 문의 등록
//   async postProductInquiry(
//     userId: string,
//     productId: string,
//     data: CreateInquiryDto
//   ): Promise<InquiryResponse> {
//     const product = await productRepository.findByProductId(productId);
//     if (!product) {
//       throw new NotFoundError();
//     }
//     const { title, content, isSecret } = data;
//     if (!title || !content) {
//       throw new BadRequestError();
//     }
//     const inquiry = await productRepository.createInquiry(userId, productId, {
//       title,
//       content,
//       isSecret,
//     });

//     // --- 알림 로직 시작 ---
//     const sellerId = await productRepository.findSellerIdByProductId(productId);
//     if (sellerId) {
//       const sellerDto: CreateNotificationDto = {
//         content: `${product.name}에 새로운 문의가 등록되었습니다.`,
//         type: NotificationType.SELLER_NEW_INQUIRY,
//       };
//       notificationService.createAndSendNotification(sellerId, sellerDto);
//     }
//     // --- 알림 로직 종료 ---

//     return inquiry;
//   },

//   // 상품 문의 목록조회
//   async getProductInquiries(productId: string): Promise<InquiriesListResponse> {
//     const product = await productRepository.findByProductId(productId);
//     if (!product) {
//       throw new NotFoundError();
//     }
//     const list = await productRepository.getInquiries(productId);
//     return {
//       list: list.map((inq) => ({
//         id: inq.id,
//         userId: inq.userId,
//         productId: inq.productId,
//         title: inq.title,
//         content: inq.content,
//         status: inq.status,
//         isSecret: inq.isSecret,
//         createdAt: inq.createdAt,
//         updatedAt: inq.updatedAt,
//         user: { name: inq.user.name },
//         reply: inq.InquiryReply
//           ? {
//               id: inq.InquiryReply.id,
//               content: inq.InquiryReply.content,
//               createdAt: inq.InquiryReply.createdAt,
//               updatedAt: inq.InquiryReply.updatedAt,
//               user: { name: inq.InquiryReply.user.name },
//             }
//           : null,
//       })),
//       totalCount: list.length,
//     };
//   },
// };

import { BadRequestError, NotFoundError } from '../common/errors/error-type';
import ProductRepository from './product.repository';
import {
  CreateProductDto,
  GetProductsParams,
  DetailProductResponse,
  UpdateProductDto,
  CategoryType,
  ProductListResponse,
  ReviewDto,
} from './dto/product.dto';
import { NotificationType, Prisma } from '@prisma/client';
import { CreateInquiryDto, InquiriesListResponse, InquiryResponse } from './dto/inquiry.dto';
import { NotificationService } from 'src/notification/notification.service';
import { CreateNotificationDto } from 'src/notification/dto/create.dto';
import StoreRepository from 'src/stores/stores.repository';

export default class ProductService {
  private readonly productRepository: ProductRepository;
  private readonly storeRepository: StoreRepository;
  private readonly notificationService: NotificationService;

  constructor(
    productRepository: ProductRepository,
    storeRepository: StoreRepository,
    notificationService: NotificationService
  ) {
    this.productRepository = productRepository;
    this.storeRepository = storeRepository;
    this.notificationService = notificationService;
  }

  //  상품 등록
  async createProduct(userId: string, body: CreateProductDto): Promise<DetailProductResponse> {
    const seller = await this.productRepository.findSellerByUserId(userId);
    if (!seller) throw new NotFoundError();

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

    if (!name || !price || !categoryName || !stocks) throw new BadRequestError();

    const category = await this.productRepository.findCategoryByName(categoryName.toUpperCase());
    if (!category) throw new NotFoundError();

    const product = await this.productRepository.create({
      name,
      price,
      content,
      image,
      discountRate,
      discountStartTime: discountStartTime ? new Date(discountStartTime) : null,
      discountEndTime: discountEndTime ? new Date(discountEndTime) : null,
      store: { connect: { id: seller.id } },
      Category: { connect: { id: category.id } },
      Stock: {
        create: stocks.map((s) => ({
          size: { connect: { id: s.sizeId } },
          quantity: s.quantity,
        })),
      },
    });

    await this.storeRepository.updateProductCount(seller.id);

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
        ? { id: product.Category.id, name: product.Category.name as CategoryType }
        : { id: '', name: 'UNKNOWN' as CategoryType },
      stocks: product.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name },
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
  }

  //  상품 목록 조회
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

    const where: Prisma.ProductWhereInput = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (priceMin !== undefined || (priceMax !== undefined && priceMax !== 0)) {
      where.price = {
        ...(priceMin !== undefined ? { gte: priceMin } : {}),
        ...(priceMax !== undefined && priceMax !== 0 ? { lte: priceMax } : {}),
      };
    }
    if (size)
      where.Stock = { some: { size: { is: { name: { contains: size, mode: 'insensitive' } } } } };
    if (favoriteStore) where.storeId = favoriteStore;
    if (categoryName) where.Category = { name: categoryName.toUpperCase() };

    let orderBy: Prisma.ProductOrderByWithRelationInput = {};
    switch (sort) {
      case 'lowPrice':
        orderBy = { price: 'asc' };
        break;
      case 'highPrice':
        orderBy = { price: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const totalCount = await this.productRepository.count(where);
    const list = await this.productRepository.findMany(
      where,
      orderBy,
      (page - 1) * pageSize,
      pageSize
    );

    const salesRaw = await this.productRepository.getSalesByProducts(list.map((p) => p.id));
    const salesMap: Record<string, number> = Object.fromEntries(
      salesRaw.map((s) => [s.productId, s._sum.quantity || 0])
    );

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
  }

  //  상품 수정
  async updateProduct(
    userId: string,
    productId: string,
    body: UpdateProductDto
  ): Promise<DetailProductResponse> {
    const seller = await this.productRepository.findSellerByUserId(userId);
    if (!seller) throw new BadRequestError();

    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError();

    const previousStocks = product.Stock;

    let categoryConnect;
    if (body.categoryName) {
      const category = await this.productRepository.findCategoryByName(
        body.categoryName.toUpperCase()
      );
      if (!category) throw new NotFoundError();
      categoryConnect = { connect: { id: category.id } };
    } else if (product.Category) {
      categoryConnect = { connect: { id: product.Category.id } };
    }

    const data: Prisma.ProductUpdateInput = {
      name: body.name ?? product.name,
      price: body.price ?? product.price,
      content: body.content ?? product.content,
      image: body.image ?? product.image,
      discountRate: body.discountRate ?? product.discountRate,
      discountStartTime: body.discountStartTime
        ? new Date(body.discountStartTime)
        : product.discountStartTime,
      discountEndTime: body.discountEndTime
        ? new Date(body.discountEndTime)
        : product.discountEndTime,
      isSoldOut: body.isSoldOut ?? product.isSoldOut,
      Category: categoryConnect,
    };

    const stocks = body.stocks?.map((s) => ({ sizeId: s.sizeId, quantity: s.quantity }));
    const updatedProduct = await this.productRepository.updateWithStocks(productId, data, stocks);

    //  알림 로직
    const sellerId = seller.id;
    for (const updatedStock of updatedProduct.Stock) {
      const previousStock = previousStocks.find((s) => s.sizeId === updatedStock.sizeId);

      // 품절 알림
      if (previousStock && previousStock.quantity > 0 && updatedStock.quantity === 0) {
        const sizeName = updatedStock.size.name;
        const usersToNotify = await this.productRepository.findUsersWithProductAndSizeInCart(
          productId,
          updatedStock.sizeId
        );

        for (const buyerId of usersToNotify) {
          const buyerDto: CreateNotificationDto = {
            content: `장바구니에 담은 상품 '${updatedProduct.name} (${sizeName})'이 품절되었습니다.`,
            type: NotificationType.BUYER_SOLD_OUT,
            size: sizeName,
          };
          await this.notificationService.createAndSendNotification(buyerId, buyerDto);
        }

        const sellerDto: CreateNotificationDto = {
          content: `${updatedProduct.name}의 ${sizeName}사이즈가 품절되었습니다.`,
          type: NotificationType.SELLER_SOLD_OUT,
          size: sizeName,
        };
        await this.notificationService.createAndSendNotification(sellerId, sellerDto);
      }

      // 재입고 알림
      if (previousStock && previousStock.quantity === 0 && updatedStock.quantity > 0) {
        const sizeName = updatedStock.size.name;
        const usersToNotify = await this.productRepository.findUsersWithProductAndSizeInCart(
          productId,
          updatedStock.sizeId
        );

        for (const buyerId of usersToNotify) {
          const buyerDto: CreateNotificationDto = {
            content: `상품 '${updatedProduct.name} (${sizeName})'이 재입고 되었습니다.`,
            type: NotificationType.BUYER_RESTOCKED,
            size: sizeName,
          };
          await this.notificationService.createAndSendNotification(buyerId, buyerDto);
        }
      }
    }

    return {
      id: updatedProduct.id,
      name: updatedProduct.name,
      image: updatedProduct.image,
      content: updatedProduct.content || '',
      createdAt: updatedProduct.createdAt.toISOString(),
      updatedAt: updatedProduct.updatedAt.toISOString(),
      reviewsRating: 0,
      reviewsCount: 0,
      reviews: [],
      inquiries: [],
      category: updatedProduct.Category
        ? { id: updatedProduct.Category.id, name: updatedProduct.Category.name as CategoryType }
        : { id: '', name: 'UNKNOWN' as CategoryType },
      stocks: updatedProduct.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name },
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
  }

  //  상품 상세조회
  async getProductDetail(productId: string): Promise<DetailProductResponse> {
    const product = await this.productRepository.findById(productId);
    if (!product) throw new NotFoundError();

    const reviewsCount = product.Review.length;
    const reviewsRating =
      reviewsCount > 0 ? product.Review.reduce((sum, r) => sum + r.rating, 0) / reviewsCount : 0;

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
      category: product.Category
        ? { id: product.Category.id, name: product.Category.name as CategoryType }
        : { id: '', name: 'UNKNOWN' as CategoryType },
      stocks: product.Stock.map((s) => ({
        id: s.id,
        productId: s.productId,
        quantity: s.quantity,
        size: { id: s.sizeId, name: s.size.name },
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
  }

  //  상품 삭제
  async deleteProduct(userId: string, productId: string) {
    const seller = await this.productRepository.findSellerByUserId(userId);
    if (!seller) throw new BadRequestError();

    const product = await this.productRepository.findByProductId(productId);
    if (!product) throw new NotFoundError();

    const deleted = await this.productRepository.delete(productId);
    await this.storeRepository.updateProductCount(seller.id);

    return deleted;
  }

  //  상품 문의 등록
  async postProductInquiry(
    userId: string,
    productId: string,
    data: CreateInquiryDto
  ): Promise<InquiryResponse> {
    const product = await this.productRepository.findByProductId(productId);
    if (!product) throw new NotFoundError();

    const { title, content, isSecret } = data;
    if (!title || !content) throw new BadRequestError();

    const inquiry = await this.productRepository.createInquiry(userId, productId, {
      title,
      content,
      isSecret,
    });

    const sellerId = await this.productRepository.findSellerIdByProductId(productId);
    if (sellerId) {
      const sellerDto: CreateNotificationDto = {
        content: `${product.name}에 새로운 문의가 등록되었습니다.`,
        type: NotificationType.SELLER_NEW_INQUIRY,
      };
      await this.notificationService.createAndSendNotification(sellerId, sellerDto);
    }

    return inquiry;
  }

  //  상품 문의 목록조회
  async getProductInquiries(productId: string): Promise<InquiriesListResponse> {
    const product = await this.productRepository.findByProductId(productId);
    if (!product) throw new NotFoundError();

    const list = await this.productRepository.getInquiries(productId);

    return {
      list: list.map((inq) => ({
        id: inq.id,
        userId: inq.userId,
        productId: inq.productId,
        title: inq.title,
        content: inq.content,
        status: inq.status,
        isSecret: inq.isSecret,
        createdAt: inq.createdAt,
        updatedAt: inq.updatedAt,
        user: { name: inq.user.name },
        reply: inq.InquiryReply
          ? {
              id: inq.InquiryReply.id,
              content: inq.InquiryReply.content,
              createdAt: inq.InquiryReply.createdAt,
              updatedAt: inq.InquiryReply.updatedAt,
              user: { name: inq.InquiryReply.user.name },
            }
          : null,
      })),
      totalCount: list.length,
    };
  }
}
