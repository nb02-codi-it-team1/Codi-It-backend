import 'reflect-metadata';
import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';

describe('UserController 통합 테스트', () => {
  const TEST_USER_EMAIL = 'integration_user@test.com';
  const TEST_USER_PASSWORD = '12345678';
  const TEST_USER_NAME = '통합테스트유저';
  let accessToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // 기존 테스트 유저 제거
    await prisma.user.deleteMany({ where: { email: TEST_USER_EMAIL } });

    // grade
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({
        data: { name: 'Green', rate: 0, minAmount: 0 },
      });
    }

    // 테스트 유저 생성
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
        password: hashedPassword,
        type: 'BUYER',
        image: 'https://example.com/profile.png',
        points: 0,
        gradeid: grade.id,
      },
    });

    // AccessToken 발급
    accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      type: user.type,
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

  describe('POST /api/users', () => {
    test('회원가입 성공 시 201 반환', async () => {
      const res = await request(app).post('/api/users').send({
        name: '신규회원',
        email: 'newuser@test.com',
        password: 'abcdef',
        type: 'BUYER',
      });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email', 'newuser@test.com');

      await prisma.user.deleteMany({ where: { email: 'newuser@test.com' } });
    });

    test('이메일 형식이 잘못된 경우 400 반환', async () => {
      const res = await request(app).post('/api/users').send({
        name: '테스트',
        email: 'invalid-email',
        password: 'abc',
        type: 'BUYER',
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', '유효성 검사 실패');
    });
  });

  describe('GET /api/users/me', () => {
    test('정상 조회 시 200과 유저 정보 반환', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', TEST_USER_EMAIL);
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/users/me', () => {
    test('정상 수정 시 200 반환', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '수정된이름',
          currentPassword: TEST_USER_PASSWORD,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', '수정된이름');
    });

    test('비밀번호 누락 시 400 반환', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '누락테스트',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/me/likes', () => {
    test('정상 요청 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/users/me/likes')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).get('/api/users/me/likes');
      expect(res.status).toBe(401);
    });
  });
});
