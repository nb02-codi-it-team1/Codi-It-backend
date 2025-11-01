import 'reflect-metadata';
import request from 'supertest';
import prisma from '../../src/common/prisma/client';
import bcrypt from 'bcrypt';
import { generateAccessToken } from '../../src/auth/jwt';
import app from '../../src/app';

describe('NotificationController 통합 테스트', () => {
  const TEST_USER_EMAIL = 'integration_notification_user@test.com';
  const TEST_USER_PASSWORD = '12345678';
  const TEST_USER_NAME = '알림테스트유저';

  let accessToken: string;
  let notificationId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Grade
    let grade = await prisma.grade.findFirst();
    if (!grade) {
      grade = await prisma.grade.create({
        data: { name: 'Green', rate: 0, minAmount: 0 },
      });
    }

    // User 생성
    const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    const user = await prisma.user.create({
      data: {
        email: TEST_USER_EMAIL,
        name: TEST_USER_NAME,
        password: hashedPassword,
        type: 'BUYER',
        gradeid: grade.id,
      },
    });

    // JWT 생성
    accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      type: user.type,
    });

    // 기본 알림 생성
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        content: '기본 알림입니다.',
        type: 'BUYER_RESTOCKED',
      },
    });
    notificationId = notification.id;
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

  // SSE 연결
  describe('GET /api/notifications/sse', () => {
    test('토큰 없이 연결 시 401 반환', async () => {
      const res = await request(app)
        .get('/api/notifications/sse')
        .set('Accept', 'text/event-stream');
      expect(res.status).toBe(401);
    });
  });

  // 알림 목록 조회
  describe('GET /api/notifications', () => {
    test('정상 조회 시 200 반환', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('content', '기본 알림입니다.');
    });

    test('토큰 없이 조회 시 401 반환', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  // 알림 읽음 처리
  describe('PATCH /api/notifications/:alarmId/check', () => {
    test('정상 읽음 처리 시 200 반환', async () => {
      const res = await request(app)
        .patch(`/api/notifications/${notificationId}/check`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(res.status).toBe(200);

      // DB 확인
      const updated = await prisma.notification.findUnique({
        where: { id: notificationId },
      });
      expect(updated?.isChecked).toBe(true);
    });

    test('잘못된 알림 ID로 요청 시 500 또는 400 반환', async () => {
      const res = await request(app)
        .patch('/api/notifications/invalid-id/check')
        .set('Authorization', `Bearer ${accessToken}`);
      expect([400, 500]).toContain(res.status);
    });

    test('토큰 없이 요청 시 401 반환', async () => {
      const res = await request(app).patch(`/api/notifications/${notificationId}/check`);
      expect(res.status).toBe(401);
    });
  });
});
