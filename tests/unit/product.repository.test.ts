import { productRepository } from 'src/product/product.repository';
import prisma from 'src/common/prisma/client';
import { InquiryStatus } from '@prisma/client';

jest.mock('src/common/prisma/client', () => ({
  __esModule: true,
  default: {
    product: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    store: {
      findUnique: jest.fn(),
    },
    inquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    orderItem: {
      groupBy: jest.fn(),
    },
    cartItem: {
      findMany: jest.fn(),
    },
  },
}));
describe('productRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    test('create 정상출력 ', async () => {
      const mockStore = {
        id: 's1',
        name: 'Test Store',
        address: '123 Test St',
        detailAddress: 'Suite 100',
        phoneNumber: '010-1111-1111',
        content: 'This is a test store',
        image: 'http://example.com/image.jpg',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0,
        favoriteCount: 0,
        monthFavoriteCount: 0,
        totalSoldCount: 0,
        isDeleted: false,
      };

      const mockProduct = {
        id: 'p1',
        name: '예시옷',
        price: 20000,
        content: '바지야',
        image: 'https://example.com/images/skirt.jpg',
        discountRate: 10,
        discountStartTime: new Date('2025-10-01T00:00:00Z'),
        discountEndTime: new Date('2025-10-31T23:59:59Z'),
        createdAt: new Date('2025-09-01T12:00:00Z'),
        updatedAt: new Date('2025-09-15T12:00:00Z'),
        isSoldOut: false,
        store: mockStore,
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.create({
        name: '예시옷',
        price: 30000,
        image: 'https://example.com/images/skirt.jpg',
        content: '바지야',
        store: { connect: { id: 's1' } },
      });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: '예시옷',
          price: 30000,
          image: 'https://example.com/images/skirt.jpg',
          content: '바지야',
          store: { connect: { id: 's1' } },
        },
        include: {
          store: true,
          Stock: { include: { size: true } },
          Category: true,
        },
      });
      expect(result).toBe(mockProduct);
    });
  });

  describe('updateWithStocks', () => {
    test('update 정상출력', async () => {
      const mockStore = {
        id: 's1',
        name: 'Test Store',
        address: '123 Test St',
        detailAddress: 'Suite 100',
        phoneNumber: '010-1111-1111',
        content: 'This is a test store',
        image: 'http://example.com/image.jpg',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0,
        favoriteCount: 0,
        monthFavoriteCount: 0,
        totalSoldCount: 0,
        isDeleted: false,
      };

      const mockProduct = {
        id: 'p1',
        name: '예시옷',
        price: 20000,
        content: '바지야',
        image: 'https://example.com/images/skirt.jpg',
        discountRate: 10,
        discountStartTime: new Date('2025-10-01T00:00:00Z'),
        discountEndTime: new Date('2025-10-31T23:59:59Z'),
        createdAt: new Date('2025-09-01T12:00:00Z'),
        updatedAt: new Date('2025-09-15T12:00:00Z'),
        isSoldOut: false,
        store: mockStore,
      };

      (prisma.product.update as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productRepository.updateWithStocks('p1', { name: 'Updated test' }, [
        { sizeId: 1, quantity: 10 },
      ]);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: expect.objectContaining({
          name: 'Updated test',
          Stock: expect.objectContaining({
            deleteMany: { productId: 'p1' },
          }),
        }),
        include: expect.any(Object),
      });
      expect(result).toBe(mockProduct);
    });
  });

  describe('findById', () => {
    test('상품 아이디로 상품 불러오기', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });
      await productRepository.findById('p1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'p1' },
        include: expect.objectContaining({
          store: true,
          Stock: { include: { size: true } },
          Review: true,
          Inquiry: expect.any(Object),
          Category: true,
        }),
      });
    });
  });

  describe('createInquiry', () => {
    test('문의 등록하기 정상출력', async () => {
      const mockStore = {
        id: 's1',
        name: 'Test Store',
        address: '123 Test St',
        detailAddress: 'Suite 100',
        phoneNumber: '010-1111-1111',
        content: 'This is a test store',
        image: 'http://example.com/image.jpg',
        userId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        productCount: 0,
        favoriteCount: 0,
        monthFavoriteCount: 0,
        totalSoldCount: 0,
        isDeleted: false,
      };

      const mockProduct = {
        id: 'p1',
        name: '예시옷',
        price: 20000,
        content: '바지야',
        image: 'https://example.com/images/skirt.jpg',
        discountRate: 10,
        discountStartTime: new Date('2025-10-01T00:00:00Z'),
        discountEndTime: new Date('2025-10-31T23:59:59Z'),
        createdAt: new Date('2025-09-01T12:00:00Z'),
        updatedAt: new Date('2025-09-15T12:00:00Z'),
        isSoldOut: false,
        store: mockStore,
      };
      const mockInquiry = {
        id: 'inq1',
        userId: 'u1',
        productId: 'p1',
        title: '문의 제목',
        content: '문의 내용입니다.',
        status: InquiryStatus.WaitingAnswer,
        isSecret: false,
        createdAt: new Date('2025-10-16T12:00:00Z'),
        updatedAt: new Date('2025-10-16T12:00:00Z'),
        user: {
          id: 'u1',
          name: '홍길동',
          email: 'hong@test.com',
        },
        product: mockProduct,
        InquiryReply: null,
      };

      (prisma.inquiry.create as jest.Mock).mockResolvedValue(mockInquiry);

      const data = { title: '문의 제목', content: '내용', isSecret: false };
      const result = await productRepository.createInquiry('u1', 'p1', data);

      expect(prisma.inquiry.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          productId: 'p1',
          title: '문의 제목',
          content: '내용',
          status: InquiryStatus.WaitingAnswer,
          isSecret: false,
        },
      });
      expect(result).toBe(mockInquiry);
    });
  });

  describe('count', () => {
    test('상품 개수 정상출력', async () => {
      (prisma.product.count as jest.Mock).mockResolvedValue(5);
      const result = await productRepository.count({ isSoldOut: false });

      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { isSoldOut: false },
      });
      expect(result).toBe(5);
    });
  });

  describe('getSalesByProducts', () => {
    test('should group order items by productId', async () => {
      (prisma.orderItem.groupBy as jest.Mock).mockResolvedValue([
        { productId: 'p1', _sum: { quantity: 10 } },
      ]);
      const result = await productRepository.getSalesByProducts(['p1']);

      expect(prisma.orderItem.groupBy).toHaveBeenCalledWith({
        by: ['productId'],
        _sum: { quantity: true },
        where: { productId: { in: ['p1'] } },
      });
      expect(result).toEqual([{ productId: 'p1', _sum: { quantity: 10 } }]);
    });
  });
});
