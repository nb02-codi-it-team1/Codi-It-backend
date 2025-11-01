import 'reflect-metadata';
import request from 'supertest';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';
import app from '../../src/app';

describe('DashboardController 통합 테스트', () => {
  const TEST_SELLER_EMAIL = 'integration_dashboard_seller@test.com';
  const TEST_BUYER_EMAIL = 'integration_dashboard_buyer@test.com';
  const TEST_PASSWORD = '12345678';
  const TEST_SELLER_NAME = '대시보드테스트판매자';
  const TEST_BUYER_NAME = '대시보드테스트구매자';

  let sellerToken: string;
  let buyerToken: string;
  let productId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Grade
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({
        data: { name: 'Green', rate: 0, minAmount: 0 },
      });
    }

    // Category
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: { name: 'SHOES' },
      });
    }

    // Size
    let size = await prisma.size.findFirst();
    if (!size) {
      size = await prisma.size.create({
        data: { id: 250, name: '250', ko: '250', en: '250' },
      });
    }

    // SELLER 생성
    const hashedSellerPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const seller = await prisma.user.create({
      data: {
        email: TEST_SELLER_EMAIL,
        name: TEST_SELLER_NAME,
        password: hashedSellerPassword,
        type: 'SELLER',
        gradeid: grade.id,
      },
    });

    // STORE 생성
    const store = await prisma.store.create({
      data: {
        userId: seller.id,
        name: '대시보드테스트스토어',
        address: '서울특별시 강남구',
        detailAddress: '테스트로 123',
        phoneNumber: '010-3333-4444',
        content: '대시보드 통합테스트용 스토어입니다.',
      },
    });

    // PRODUCT 생성
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: '대시보드테스트상품',
        price: 35000,
        image: 'https://example.com/dashboard.png',
        content: '테스트 상품입니다.',
        categoryId: category.id,
      },
    });
    productId = product.id;

    // BUYER 생성
    const hashedBuyerPassword = await bcrypt.hash(TEST_PASSWORD, 10);
    const buyer = await prisma.user.create({
      data: {
        email: TEST_BUYER_EMAIL,
        name: TEST_BUYER_NAME,
        password: hashedBuyerPassword,
        type: 'BUYER',
        gradeid: grade.id,
      },
    });

    // JWT 생성
    sellerToken = generateAccessToken({
      sub: seller.id,
      email: seller.email,
      type: 'SELLER',
    });

    buyerToken = generateAccessToken({
      sub: buyer.id,
      email: buyer.email,
      type: 'BUYER',
    });

    // 테스트용 주문 데이터 생성
    const order = await prisma.order.create({
      data: {
        name: '홍길동',
        phoneNumber: '010-2222-3333',
        address: '서울특별시 강남구 테스트로 1',
        subtotal: 70000,
        totalQuantity: 2,
      },
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        price: 70000,
        status: 'CompletedPayment',
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: productId,
        sizeId: '250',
        quantity: 2,
        price: 70000,
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({});
    await prisma.inquiryReply.deleteMany({});
    await prisma.inquiry.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // 대시보드 조회
  describe('GET /api/dashboard', () => {
    test('SELLER 인증으로 대시보드 요약 정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('today');
      expect(res.body).toHaveProperty('month');
      expect(res.body).toHaveProperty('topSales');
      expect(Array.isArray(res.body.topSales)).toBe(true);
    });

    test('SELLER가 아닌 BUYER로 접근 시 403 반환', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect([400, 403]).toContain(res.status);
    });

    test('인증 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/dashboard');
      expect(res.status).toBe(401);
    });
  });
});
