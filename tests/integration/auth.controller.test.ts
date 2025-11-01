import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';

describe('AuthController 통합 테스트', () => {
  const TEST_USER_EMAIL = 'integration_auth@test.com';
  const TEST_USER_PASSWORD = '123456';

  beforeAll(async () => {
    await prisma.$connect();

    // 테스트 유저 생성
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: '테스트 유저',
        password: hashedPassword,
        type: 'BUYER',
        image: 'https://example.com/profile.png',
        points: 0,
        gradeid: 'grade_green',
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
    await prisma.product.deleteMany({});
    await prisma.store.deleteMany({});
    await prisma.user.deleteMany({});

    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    test('정상 로그인 시 201과 accessToken 반환', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
    });

    test('잘못된 비밀번호 시 401 반환', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: TEST_USER_EMAIL, password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    test('존재하지 않는 이메일 시 404 반환', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: TEST_USER_PASSWORD });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('RefreshToken이 없으면 401 반환', async () => {
      const res = await request(app).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    test('로그아웃 시 200 반환', async () => {
      const res = await request(app).post('/api/auth/logout');
      expect(res.status).toBe(200);
    });
  });
});
