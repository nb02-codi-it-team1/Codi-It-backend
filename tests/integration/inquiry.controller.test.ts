import 'reflect-metadata';
import request from 'supertest';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';
import app from '../../src/app';

describe('InquiryController 통합 테스트', () => {
  const TEST_SELLER_EMAIL = 'integration_inquiry_seller@test.com';
  const TEST_BUYER_EMAIL = 'integration_inquiry_buyer@test.com';
  const TEST_PASSWORD = '12345678';
  const TEST_SELLER_NAME = '문의판매자';
  const TEST_BUYER_NAME = '문의구매자';

  let sellerToken: string;
  let buyerToken: string;
  let inquiryId: string;
  let replyId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 등급
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({
        data: { name: 'Green', rate: 0, minAmount: 0 },
      });
    }

    // 카테고리
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({ data: { name: 'SHOES' } });
    }

    // 사이즈
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

    const store = await prisma.store.create({
      data: {
        userId: seller.id,
        name: '문의테스트스토어',
        address: '서울시 강남구',
        detailAddress: '테스트길 11',
        phoneNumber: '010-1234-5678',
        content: '문의 테스트용 스토어입니다.',
      },
    });

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

    // 상품 생성
    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name: '문의테스트상품',
        price: 59000,
        image: 'https://example.com/product.png',
        content: '테스트 상품입니다.',
        categoryId: category.id,
      },
    });

    // JWT 발급
    sellerToken = generateAccessToken({ sub: seller.id, email: seller.email, type: 'SELLER' });
    buyerToken = generateAccessToken({ sub: buyer.id, email: buyer.email, type: 'BUYER' });

    // 기본 문의 1개 생성 (BUYER)
    const inquiry = await prisma.inquiry.create({
      data: {
        userId: buyer.id,
        productId: product.id,
        title: '테스트 문의 제목',
        content: '테스트 문의 내용입니다.',
        status: 'WaitingAnswer',
        isSecret: false,
      },
    });
    inquiryId = inquiry.id;
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

  // 내 문의 목록 조회
  describe('GET /api/inquiries', () => {
    test('BUYER 내 문의 조회 성공 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    test('SELLER 문의 목록 조회 성공 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/inquiries')
        .set('Authorization', `Bearer ${sellerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
    });

    test('토큰 없이 조회 시 401 반환', async () => {
      const res = await request(app).get('/api/inquiries');
      expect(res.status).toBe(401);
    });
  });

  // 문의 상세 조회
  describe('GET /api/inquiries/:inquiryId', () => {
    test('정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', inquiryId);
    });

    test('존재하지 않는 문의 ID로 조회 시 404 반환', async () => {
      const res = await request(app)
        .get('/api/inquiries/non-existing-id')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(404);
    });
  });

  // 문의 수정
  describe('PATCH /api/inquiries/:inquiryId', () => {
    test('BUYER 본인 문의 수정 성공 시 201 반환', async () => {
      const res = await request(app)
        .patch(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ content: '수정된 문의 내용' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('content', '수정된 문의 내용');
    });

    test('SELLER가 수정 시 403 반환', async () => {
      const res = await request(app)
        .patch(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ content: '잘못된 수정' });
      expect([400, 403]).toContain(res.status);
    });
  });

  // 문의 답변 생성
  describe('POST /api/inquiries/:inquiryId/replies', () => {
    test('SELLER가 답변 생성 시 201 반환', async () => {
      const res = await request(app)
        .post(`/api/inquiries/${inquiryId}/replies`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ content: '답변 내용입니다.' });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('content', '답변 내용입니다.');
      replyId = res.body.id;
    });

    test('BUYER가 답변 생성 시 403 반환', async () => {
      const res = await request(app)
        .post(`/api/inquiries/${inquiryId}/replies`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ content: '잘못된 접근' });
      expect([400, 403]).toContain(res.status);
    });
  });

  // 답변 상세 조회
  describe('GET /api/inquiries/:replyId/replies', () => {
    test('정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get(`/api/inquiries/${replyId}/replies`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
    });

    test('존재하지 않는 ID로 조회 시 404 반환', async () => {
      const res = await request(app)
        .get('/api/inquiries/non-existing-id/replies')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(404);
    });
  });

  // 답변 수정
  describe('PATCH /api/inquiries/:replyId/replies', () => {
    test('SELLER가 답변 수정 시 200 반환', async () => {
      const res = await request(app)
        .patch(`/api/inquiries/${replyId}/replies`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ content: '수정된 답변입니다.' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', '수정된 답변입니다.');
    });

    test('BUYER가 답변 수정 시 403 반환', async () => {
      const res = await request(app)
        .patch(`/api/inquiries/${replyId}/replies`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ content: '수정 시도' });
      expect([400, 403]).toContain(res.status);
    });
  });

  // 문의 삭제
  describe('DELETE /api/inquiries/:inquiryId', () => {
    test('BUYER 본인 문의 삭제 시 200 반환', async () => {
      const res = await request(app)
        .delete(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', inquiryId);
    });

    test('SELLER가 문의 삭제 시 403 반환', async () => {
      const res = await request(app)
        .delete(`/api/inquiries/${inquiryId}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      expect([400, 403]).toContain(res.status);
    });
  });
});
