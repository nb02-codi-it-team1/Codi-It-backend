import 'reflect-metadata';
import request from 'supertest';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';
import app from '../../src/app';

describe('StoreController 통합 테스트', () => {
  const TEST_SELLER_EMAIL = 'integration_store_seller@test.com';
  const TEST_SELLER_PASSWORD = '12345678';
  const TEST_SELLER_NAME = '스토어테스트셀러';

  let accessToken: string;
  let storeId: string;
  let sellerId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // grade 생성 or 확보
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({
        data: { name: 'Green', rate: 0, minAmount: 0 },
      });
    }

    // seller 생성
    const hashedPassword = await bcrypt.hash(TEST_SELLER_PASSWORD, 10);
    const seller = await prisma.user.create({
      data: {
        email: TEST_SELLER_EMAIL,
        name: TEST_SELLER_NAME,
        password: hashedPassword,
        type: 'SELLER',
        image: 'https://example.com/seller.png',
        points: 0,
        gradeid: grade.id,
      },
    });

    sellerId = seller.id;

    // 실제 JWT accessToken 생성
    accessToken = generateAccessToken({
      sub: seller.id,
      email: seller.email,
      type: seller.type,
    });
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

  describe('POST /api/stores', () => {
    test('스토어 생성 성공 시 201 반환', async () => {
      const res = await request(app)
        .post('/api/stores')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '새로운테스트스토어',
          address: '서울시 서초구',
          detailAddress: '테스트로 11-1',
          phoneNumber: '010-1111-2222',
          content: '테스트용 신규 스토어입니다.',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', '새로운테스트스토어');
      storeId = res.body.id;
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).post('/api/stores').send({
        name: '인증실패스토어',
        address: '서울시 마포구',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/stores/:storeId', () => {
    test('스토어 정보 수정 성공 시 200 반환', async () => {
      const res = await request(app)
        .patch(`/api/stores/${storeId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '수정된 내용입니다.' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', '수정된 내용입니다.');
    });

    test('잘못된 스토어 ID로 수정 시 404 반환', async () => {
      const res = await request(app)
        .patch(`/api/stores/invalid-id`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: '수정불가' });

      expect([400, 404]).toContain(res.status);
    });
  });

  describe('GET /api/stores/:storeId', () => {
    test('정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get(`/api/stores/${storeId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', storeId);
      expect(res.body).toHaveProperty('name');
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).get(`/api/stores/${storeId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stores/detail/my', () => {
    test('내 스토어 상세 조회 성공 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/stores/detail/my')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userId', sellerId);
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/stores/detail/my');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/stores/detail/my/product', () => {
    test('내 스토어 상품 목록 정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/stores/detail/my/product')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('list');
      expect(Array.isArray(res.body.list)).toBe(true);
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/stores/detail/my/product');
      expect(res.status).toBe(401);
    });
  });

  describe('POST/DELETE /api/stores/:storeId/favorite', () => {
    test('좋아요 등록 후 삭제까지 성공 시 200 반환', async () => {
      const like = await request(app)
        .post(`/api/stores/${storeId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(like.status).toBe(200);

      const unlike = await request(app)
        .delete(`/api/stores/${storeId}/favorite`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(unlike.status).toBe(200);
    });

    test('인증 없이 좋아요 요청 시 401 반환', async () => {
      const res = await request(app).post(`/api/stores/${storeId}/favorite`);
      expect(res.status).toBe(401);
    });
  });
});
