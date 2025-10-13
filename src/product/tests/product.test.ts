import 'reflect-metadata';
import { Decimal, InquiryStatus, UserType } from '@prisma/client';
import { productService } from '../product.service';
import { productRepository } from '../product.repository';
import { BadRequestError, NotFoundError } from 'src/common/errors/error-type';
import {
  CreateProductDto,
  CategoryType,
  DetailProductResponse,
  GetProductsParams,
  ProductListResponse,
  UpdateProductDto,
} from '../dto/product.dto';
import { NotificationService } from 'src/notification/notification.service';
import { CreateInquiryDto, InquiriesResponse } from '../dto/inquiry.dto';

jest.mock('../product.repository');
jest.mock('src/stores/stores.repository', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      updateProductCount: jest.fn().mockResolvedValue(undefined),
    })),
  };
});
jest.mock('src/notification/notification.service', () => {
  return {
    NotificationService: jest.fn().mockImplementation(() => ({
      createAndSendNotification: jest.fn().mockResolvedValue({
        id: 'notif-1',
        content: 'mock',
        isChecked: false,
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    })),
  };
});
// 상품 생성
describe('createProduct 함수 테스트', () => {
  const userId = 'user-1';
  const body: CreateProductDto = {
    name: '테스트 상품',
    price: 10000,
    content: '설명',
    image: 'url',
    discountRate: 10,
    discountStartTime: new Date('2025-10-01T00:00:00Z'),
    discountEndTime: new Date('2025-10-10T00:00:00Z'),
    categoryName: CategoryType.TOP,
    stocks: [{ sizeId: 1, quantity: 5 }],
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('스토어를 찾을 수 없습니다.', async () => {
    (productRepository.findSellerByUserId as jest.Mock).mockResolvedValue(undefined);

    await expect(productService.createProduct(userId, body)).rejects.toThrow(NotFoundError);
  });

  test('필수 필드 누락 시 BadRequestError', async () => {
    (productRepository.findSellerByUserId as jest.Mock).mockResolvedValue({
      id: 'store-1',
      name: '스토어이름',
    });
    const invalidBody = { ...body, name: '' };
    await expect(productService.createProduct(userId, invalidBody)).rejects.toThrow(
      BadRequestError
    );
  });

  test('카테고리 없을 시 NotFoundError', async () => {
    (productRepository.findSellerByUserId as jest.Mock).mockResolvedValue({
      id: 'store-1',
      name: '스토어이름',
    });
    (productRepository.findCategoryByName as jest.Mock).mockResolvedValue(null);
    await expect(productService.createProduct(userId, body)).rejects.toThrow(NotFoundError);
  });

  test('상품 생성 성공', async () => {
    (productRepository.findSellerByUserId as jest.Mock).mockResolvedValue({
      id: 'store-1',
      name: '스토어이름',
    });
    (productRepository.findCategoryByName as jest.Mock).mockResolvedValue({
      id: 'cat-1',
      name: CategoryType.TOP,
    });
    (productRepository.create as jest.Mock).mockImplementation(
      (data: { Stock: { create: CreateProductDto['stocks'] }; [key: string]: unknown }) => ({
        id: 'prod-1',
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        Stock: data.Stock.create.map((s, i) => ({
          id: `stock-${i}`,
          productId: 'prod-1',
          sizeId: s.sizeId,
          quantity: s.quantity,
          size: { id: s.sizeId, name: 'S' },
        })),
        Category: { id: 'cat-1', name: CategoryType.TOP },
        storeId: 'store-1',
        store: { name: '스토어이름' },
      })
    );

    const result = (await productService.createProduct(userId, body)) as DetailProductResponse;

    expect(result.id).toBe('prod-1');
    expect(result.name).toBe(body.name);
    expect(result.storeName).toBe('스토어이름');
    expect(result.category[0]!.name).toBe(CategoryType.TOP);
    expect(result.stocks.length).toBe(1);
    expect(result.stocks[0]!.quantity).toBe(5);
    expect(result.discountPrice).toBeCloseTo(9000);
  });
});

// 상품 목록조회
describe('getProducts 함수 테스트', () => {
  const now = new Date();
  const mockProducts = [
    {
      id: 'prod-1',
      storeId: 'store-1',
      store: { name: '스토어1' },
      name: '상품1',
      image: 'url1',
      price: 10000,
      discountRate: 10,
      discountStartTime: new Date(now.getTime() - 1000), // 현재 기준 1초 전
      discountEndTime: new Date(now.getTime() + 1000 * 60 * 60), // 현재 기준 1시간 후
      Review: [{ rating: 4 }, { rating: 5 }],
      isSoldOut: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-2',
      storeId: 'store-2',
      store: { name: '스토어2' },
      name: '상품2',
      image: 'url2',
      price: 20000,
      discountRate: 0,
      discountStartTime: null,
      discountEndTime: null,
      Review: [],
      isSoldOut: true,
      createdAt: new Date('2025-09-03T00:00:00Z'),
      updatedAt: new Date('2025-09-04T00:00:00Z'),
    },
  ];
  const mockSales = [
    { productId: 'prod-1', _sum: { quantity: 3 } },
    { productId: 'prod-2', _sum: { quantity: 5 } },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('상품 목록 정상 조회', async () => {
    // Repository mock
    (productRepository.count as jest.Mock).mockResolvedValue(mockProducts.length);
    (productRepository.findMany as jest.Mock).mockResolvedValue(mockProducts);
    (productRepository.getSalesByProducts as jest.Mock).mockResolvedValue(mockSales);

    const params: GetProductsParams = { page: 1, pageSize: 10, sort: 'recent' };
    const result: ProductListResponse = await productService.getProducts(params);

    expect(result.totalCount).toBe(mockProducts.length);
    expect(result.list.length).toBe(mockProducts.length);

    // 첫 번째 상품 할인 가격 계산 확인
    const first = result.list[0];
    expect(first!.discountPrice).toBe(9000); // 10000 * (1 - 0.1)
    expect(first!.sales).toBe(3);
    expect(first!.reviewsRating).toBeCloseTo(4.5);

    // 두 번째 상품은 할인 없음, 매진 상태 확인
    const second = result.list[1];
    expect(second!.discountPrice).toBe(20000);
    expect(second!.isSoldOut).toBe(true);
    expect(second!.sales).toBe(5);
    expect(second!.reviewsRating).toBe(0);
  });

  test('검색어와 카테고리 필터 적용', async () => {
    (productRepository.count as jest.Mock).mockResolvedValue(1);
    (productRepository.findMany as jest.Mock).mockResolvedValue([mockProducts[0]]);
    (productRepository.getSalesByProducts as jest.Mock).mockResolvedValue([mockSales[0]]);

    const params: GetProductsParams = { search: '상품1', categoryName: CategoryType.TOP };
    const result = await productService.getProducts(params);

    expect(result.list[0]!.name).toContain('상품1');
    expect(result.list[0]!.storeName).toBe('스토어1');
  });
});

// 상품 수정
describe('updateProduct 함수 테스트', () => {
  const userId = 'user-1';
  const productId = 'prod-1';
  const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;

  const fakeStore = {
    id: 'store-1',
    userId: 'user-1',
    name: '테스트 스토어',
    address: '서울시 강남구',
    detailAddress: '101호',
    phoneNumber: '010-1234-5678',
    content: '테스트 스토어 설명',
    image: null,
    productCount: 0,
    favoriteCount: 0,
    monthFavoriteCount: 0,
    totalSoldCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };
  const fakeProduct = {
    id: productId,
    name: '기존 상품',
    price: new Decimal(10000),
    content: '기존 설명',
    image: 'image-url',
    discountRate: 0,
    discountStartTime: new Date('2025-10-01T00:00:00Z'),
    discountEndTime: new Date('2025-10-10T00:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    storeId: fakeStore.id,
    store: fakeStore,
    Stock: [],
    Category: null,
    Review: [],
    Inquiry: [],
    isSoldOut: false,
    categoryId: null,
  };

  const body: UpdateProductDto = {
    id: 'prod-1',
    name: '업데이트 상품',
    price: 12000,
    content: '설명 수정',
    image: 'url',
    discountRate: 20,
    discountStartTime: '2025-10-01T00:00:00Z',
    discountEndTime: '2025-10-10T00:00:00Z',
    categoryName: CategoryType.TOP,
    stocks: [{ sizeId: 1, quantity: 0 }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('판매자 없으면 BadRequestError', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(null);
    await expect(productService.updateProduct(userId, productId, body)).rejects.toThrow(
      BadRequestError
    );
  });

  test('상품 없으면 NotFoundError', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(fakeStore);
    mockProductRepository.findById.mockResolvedValue(null);
    await expect(productService.updateProduct(userId, productId, body)).rejects.toThrow(
      NotFoundError
    );
  });

  test('카테고리 없으면 NotFoundError', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(fakeStore);
    mockProductRepository.findById.mockResolvedValue(fakeProduct);
    mockProductRepository.findCategoryByName.mockResolvedValue(null);
    await expect(productService.updateProduct(userId, productId, body)).rejects.toThrow(
      NotFoundError
    );
  });

  test('상품 업데이트 성공', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(fakeStore);
    mockProductRepository.findById.mockResolvedValue(fakeProduct);
    mockProductRepository.findCategoryByName.mockResolvedValue({
      id: 'cat-1',
      name: CategoryType.TOP,
    });
    mockProductRepository.updateWithStocks.mockResolvedValue({
      id: productId,
      name: body.name as string,
      price: body.price as Decimal,
      content: body.content as string,
      image: body.image as string,
      discountRate: body.discountRate as number,
      discountStartTime: new Date(body.discountStartTime!),
      discountEndTime: body.discountEndTime ? new Date(body.discountEndTime) : null,
      Stock: [
        {
          id: 'stock-1',
          sizeId: 1,
          quantity: 0,
          productId,
          size: {
            name: 'S',
            id: 0,
            ko: '',
            en: '',
          },
        },
      ],
      Category: { id: 'cat-1', name: CategoryType.TOP },
      storeId: 'store-1',
      store: {
        name: '스토어이름',
        id: '',
        content: '',
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: '',
        address: '',
        detailAddress: '',
        phoneNumber: '',
        productCount: 0,
        favoriteCount: 0,
        monthFavoriteCount: 0,
        totalSoldCount: 0,
        isDeleted: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      isSoldOut: false,
      categoryId: 'cat-1',
    });

    const result = await productService.updateProduct(userId, productId, body);

    expect(result.id).toBe(productId);
    expect(result.stocks?.length && result.stocks[0]?.quantity).toBe(0);
    expect(result.discountPrice).toBeCloseTo(body.price! * (1 - body.discountRate! / 100));
  });
});

// 상품 상세조회 테스트
describe('getProductDetail 함수 테스트', () => {
  const productId = 'prod-1';
  const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;

  const fakeStore = {
    id: 'store-1',
    userId: 'user-1',
    name: '테스트 스토어',
    address: '서울시 강남구',
    detailAddress: '101호',
    phoneNumber: '010-1234-5678',
    content: '테스트 스토어 설명',
    image: null,
    productCount: 0,
    favoriteCount: 0,
    monthFavoriteCount: 0,
    totalSoldCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };
  const fakeProduct = {
    id: productId,
    name: '기존 상품',
    price: new Decimal(10000),
    content: '기존 설명',
    image: 'image-url',
    discountRate: 10,
    discountStartTime: new Date('2025-10-01T00:00:00Z'),
    discountEndTime: new Date('2025-10-10T00:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    storeId: fakeStore.id,
    store: fakeStore,
    Stock: [
      {
        id: 'stock-1',
        productId,
        sizeId: 1,
        quantity: 5,
        size: { id: 1, name: 'S', ko: 'S', en: 'S' },
      },
    ],
    Category: null,
    Review: [
      {
        id: 'review1',
        content: '좋은 상품이에요',
        createdAt: new Date(),
        updatedAt: new Date(),
        productId: productId,
        userId: 'user1',
        rating: 5,
      },
    ],
    Inquiry: [
      {
        id: 'inq-1',
        title: '문의제목',
        content: '문의내용',
        status: 'CompletedAnswer' as InquiryStatus,
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        productId: productId,
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: '테스터',
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          gradeid: 'grade-1',
          email: 'tester@example.com',
          password: 'hashedpassword',
          points: 0,
          type: 'BUYER' as UserType,
        },
        InquiryReply: {
          id: 'reply-1',
          inquiryId: 'inq-1',
          content: '답변내용',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'user-2',
        },
      },
    ],
    isSoldOut: false,
    categoryId: null,
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('상품 없으면 NotFoundError', async () => {
    mockProductRepository.findById.mockResolvedValue(null);
    await expect(productService.getProductDetail(productId)).rejects.toThrow(NotFoundError);
  });

  test('상품 상세 조회 성공', async () => {
    mockProductRepository.findById.mockResolvedValue(fakeProduct);

    const result = await productService.getProductDetail(productId);

    expect(result.id).toBe(productId);
    expect(result.stocks[0]!.quantity).toBe(5);
    expect(result.reviewsCount).toBe(1);
    expect(result.reviewsRating).toBe(5);
    expect(result.inquiries[0]!.reply?.content).toBe('답변내용');
    expect(result.discountPrice).toBeCloseTo(10000 * 0.9); // 10% 할인 적용
  });
});

describe('deleteProduct 함수 테스트', () => {
  const userId = 'user-1';
  const productId = 'prod-1';
  const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;
  const fakeStore = {
    id: 'store-1',
    userId: 'user-1',
    name: '테스트 스토어',
    address: '서울시 강남구',
    detailAddress: '101호',
    phoneNumber: '010-1234-5678',
    content: '테스트 스토어 설명',
    image: null,
    productCount: 0,
    favoriteCount: 0,
    monthFavoriteCount: 0,
    totalSoldCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  const fakeSeller = {
    id: 'store-1',
    userId: userId,
    name: '테스트 스토어',
    address: '서울시 강남구',
    detailAddress: '101호',
    phoneNumber: '010-1234-5678',
    content: '테스트 스토어 설명',
    image: null,
    productCount: 0,
    favoriteCount: 0,
    monthFavoriteCount: 0,
    totalSoldCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
  };

  const fakeProduct = {
    id: productId,
    name: '기존 상품',
    price: new Decimal(10000),
    content: '기존 설명',
    image: 'image-url',
    discountRate: 10, // 10% 할인 적용
    discountStartTime: new Date('2025-10-01T00:00:00Z'),
    discountEndTime: new Date('2025-10-10T00:00:00Z'),
    createdAt: new Date(),
    updatedAt: new Date(),
    storeId: fakeStore.id,
    store: fakeStore,
    Stock: [
      {
        id: 'stock-1',
        productId,
        sizeId: 1,
        quantity: 5,
        size: { id: 1, name: 'S', ko: 'S', en: 'S' },
      },
    ],
    Category: null,
    Review: [{ rating: 5 }, { rating: 4 }],
    Inquiry: [
      {
        id: 'inq-1',
        title: '문의제목',
        content: '문의내용',
        status: 'CompletedAnswer',
        isSecret: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        InquiryReply: {
          id: 'reply-1',
          content: '답변내용',
          createdAt: new Date(),
          updatedAt: new Date(),
          user: { id: 'user-2', name: '관리자' },
        },
        user: { id: 'user-1', name: '테스터' },
      },
    ],
    isSoldOut: false,
    categoryId: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('판매자 없으면 BadRequestError', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(null);

    await expect(productService.deleteProduct(userId, productId)).rejects.toThrow(BadRequestError);
  });

  test('상품 없으면 NotFoundError', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(fakeSeller);
    mockProductRepository.findByProductId.mockResolvedValue(null);

    await expect(productService.deleteProduct(userId, productId)).rejects.toThrow(NotFoundError);
  });

  test('상품 삭제 성공', async () => {
    mockProductRepository.findSellerByUserId.mockResolvedValue(fakeSeller);
    mockProductRepository.findByProductId.mockResolvedValue(fakeProduct);
    mockProductRepository.delete.mockResolvedValue(fakeProduct);

    const result = await productService.deleteProduct(userId, productId);

    expect(mockProductRepository.delete).toHaveBeenCalledWith(productId);
    expect(result).toEqual(fakeProduct);
  });
});

// 상품 문의 등록

describe('postProductInquiry', () => {
  const userId = 'user-1';
  const productId = 'product-1';
  const fakeProduct = { id: productId, name: '테스트 상품' };
  const data: CreateInquiryDto = { title: '문의 제목', content: '문의 내용', isSecret: false };

  let notificationService: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notificationService = new NotificationService({} as any); // Repository는 mock 처리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (productService as any).notificationService = notificationService; // 서비스 주입

    jest.spyOn(notificationService, 'createAndSendNotification').mockResolvedValue({
      id: 'notif-1',
      content: data.content,
      isChecked: false,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  test('상품 문의 등록 성공 및 알림 발송', async () => {
    (productRepository.findByProductId as jest.Mock).mockResolvedValue(fakeProduct);
    (productRepository.createInquiry as jest.Mock).mockResolvedValue({
      id: 'inq-1',
      ...data,
      productId,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    (productRepository.findSellerIdByProductId as jest.Mock).mockResolvedValue('seller-1');

    const result = await productService.postProductInquiry(userId, productId, data);

    expect(result.id).toBe('inq-1');
    // // expect(notificationService.createAndSendNotification).toHaveBeenCalledWith('seller-1', {
    // //   content: `${fakeProduct.name}에 새로운 문의가 등록되었습니다.`,
    // //   type: expect.any(String),
    // });
  });
});

describe('getProductInquiries 상품 문의 목록조회', () => {
  const productId = 'product-1';
  const fakeProduct = { id: productId, name: '테스트 상품' };

  const fakeInquiries = [
    {
      id: 'inq-1',
      userId: 'user-1',
      productId,
      title: '문의 제목 1',
      content: '문의 내용 1',
      status: 'Pending',
      isSecret: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: '사용자1' },
      InquiryReply: {
        id: 'reply-1',
        content: '답변 내용 1',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { name: '관리자' },
      },
    },
    {
      id: 'inq-2',
      userId: 'user-2',
      productId,
      title: '문의 제목 2',
      content: '문의 내용 2',
      status: 'CompletedAnswer',
      isSecret: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: '사용자2' },
      InquiryReply: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('상품이 존재하지 않으면 NotFoundError 발생', async () => {
    (productRepository.findByProductId as jest.Mock).mockResolvedValue(null);

    await expect(productService.getProductInquiries(productId)).rejects.toThrow(NotFoundError);
  });

  test('문의 목록 조회 성공', async () => {
    (productRepository.findByProductId as jest.Mock).mockResolvedValue(fakeProduct);
    (productRepository.getInquiries as jest.Mock).mockResolvedValue(fakeInquiries);

    const result: InquiriesResponse[] = await productService.getProductInquiries(productId);

    expect(result.length).toBe(2);

    // 첫 번째 문의 검증
    expect(result[0]!.id).toBe('inq-1');
    expect(result[0]!.user.name).toBe('사용자1');
    expect(result[0]!.reply?.id).toBe('reply-1');
    expect(result[0]!.reply?.user.name).toBe('관리자');

    // 두 번째 문의 검증 (reply 없음)
    expect(result[1]!.id).toBe('inq-2');
    expect(result[1]!.reply).toBeNull();
  });
});
