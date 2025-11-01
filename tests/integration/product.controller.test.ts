import 'reflect-metadata';
import request from 'supertest';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';
import app from '../../src/app';

describe('ProductController 통합 테스트)', () => {
  const TEST_SELLER_EMAIL = 'integration_product_seller@test.com';
  const TEST_BUYER_EMAIL = 'integration_product_buyer@test.com';
  const TEST_PASSWORD = '12345678';
  const TEST_SELLER_NAME = '상품셀러';
  const TEST_BUYER_NAME = '상품구매자';

  let sellerToken: string;
  let buyerToken: string;
  let storeId: string;
  let productId: string;
  let sizeId: number;

  beforeAll(async () => {
    await prisma.$connect();

    // Grade 확보
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({ data: { name: 'Green', rate: 0, minAmount: 0 } });
    }

    // Size 확보 (없으면 생성)
    let size = await prisma.size.findFirst();
    if (!size) {
      size = await prisma.size.create({
        data: { id: 250, name: '250', ko: '250', en: '250' },
      });
    }
    sizeId = size.id;

    // Category 확보
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: 'SHOES' } });
    }

    // Seller 생성
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

    // Store 생성
    const store = await prisma.store.create({
      data: {
        userId: seller.id,
        name: '통합테스트스토어',
        address: '서울특별시 강남구',
        detailAddress: '통합로 123',
        phoneNumber: '010-2222-3333',
        content: '테스트용 스토어입니다.',
      },
    });
    storeId = store.id;
    console.log(`테스트용 스토어 생성 완료: ${storeId}`);

    // Buyer 생성
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

    // JWT 발급
    sellerToken = generateAccessToken({ sub: seller.id, email: seller.email, type: 'SELLER' });
    buyerToken = generateAccessToken({ sub: buyer.id, email: buyer.email, type: 'BUYER' });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany({});
    await prisma.inquiryReply.deleteMany({});
    await prisma.inquiry.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.$disconnect();
  });

  // 상품 등록
  describe('POST /api/products', () => {
    test('상품 등록 성공 시 201 반환', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: '통합테스트상품',
          price: 89000,
          content: '이건 테스트 상품입니다.',
          image: 'https://example.com/test.png',
          discountRate: 10,
          categoryName: 'SHOES',
          stocks: [{ sizeId, quantity: 5 }],
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', '통합테스트상품');
      productId = res.body.id;
    });

    test('인증 없이 상품 등록 시 401 반환', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({
          name: '비인증상품',
          price: 50000,
          categoryName: 'SHOES',
          stocks: [{ sizeId, quantity: 3 }],
        });
      expect(res.status).toBe(401);
    });

    test('BUYER가 상품 등록 시 403 반환', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          name: '구매자등록상품',
          price: 50000,
          categoryName: 'SHOES',
          stocks: [{ sizeId, quantity: 3 }],
        });
      expect([400, 403]).toContain(res.status);
    });
  });

  // 상품 목록 조회
  describe('GET /api/products', () => {
    test('상품 목록 정상 조회 시 200 반환', async () => {
      const res = await request(app).get('/api/products?page=1&pageSize=10');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    test('검색 조건(name)으로 조회 시 200 반환', async () => {
      const res = await request(app).get('/api/products?search=통합테스트');
      expect(res.status).toBe(200);
      expect(res.body.list[0]).toHaveProperty('name');
    });
  });

  // 상품 상세 조회
  describe('GET /api/products/:productId', () => {
    test('정상 조회 시 200 반환', async () => {
      const res = await request(app).get(`/api/products/${productId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', productId);
      expect(res.body).toHaveProperty('name', '통합테스트상품');
    });

    test('존재하지 않는 상품 조회 시 404 반환', async () => {
      const res = await request(app).get('/api/products/non-existing-id');
      expect(res.status).toBe(404);
    });
  });

  // 상품 수정
  describe('PATCH /api/products/:productId', () => {
    test('상품 수정 성공 시 200 반환', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: '수정된테스트상품',
          price: 99000,
          stocks: [{ sizeId, quantity: 10 }],
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', '수정된테스트상품');
    });

    test('BUYER가 수정 시 403 반환', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ name: '구매자수정시도' });
      expect([400, 403]).toContain(res.status);
    });

    test('인증 없이 수정 시 401 반환', async () => {
      const res = await request(app)
        .patch(`/api/products/${productId}`)
        .send({ name: '비인증수정' });
      expect(res.status).toBe(401);
    });
  });

  // 상품 문의 등록
  describe('POST /api/products/:productId/inquiries', () => {
    test('상품 문의 등록 성공 시 201 반환', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/inquiries`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          title: '테스트 문의 제목',
          content: '테스트 문의 내용입니다.',
          isSecret: false,
        });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', '테스트 문의 제목');
    });

    test('SELLER가 문의 등록 시 403 반환', async () => {
      const res = await request(app)
        .post(`/api/products/${productId}/inquiries`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          title: '판매자 문의',
          content: '이건 안돼야 해요',
        });
      expect([400, 403]).toContain(res.status);
    });

    test('인증 없이 문의 등록 시 401 반환', async () => {
      const res = await request(app).post(`/api/products/${productId}/inquiries`).send({
        title: '비인증문의',
        content: '이건 실패해야 함',
      });
      expect(res.status).toBe(401);
    });
  });

  // 상품 문의 조회
  describe('GET /api/products/:productId/inquiries', () => {
    test('상품 문의 목록 조회 시 200 반환', async () => {
      const res = await request(app).get(`/api/products/${productId}/inquiries`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });
  });

  // 상품 삭제
  describe('DELETE /api/products/:productId', () => {
    test('상품 삭제 성공 시 204 반환', async () => {
      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(204);
    });

    test('인증 없이 삭제 시 401 반환', async () => {
      const res = await request(app).delete(`/api/products/${productId}`);
      expect(res.status).toBe(401);
    });
  });
});
