import { Router } from 'express';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaClient } from '@prisma/client';
import passport from 'passport';

const NotificationRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const notificationRepository = new NotificationRepository(prisma);
  const notificationService = new NotificationService(notificationRepository);
  const notificationController = new NotificationController(notificationService);

  /**
   * @swagger
   * /api/notifications/sse:
   *   get:
   *     summary: 실시간 알람 스트리밍
   *     description: 30초마다 실시간 알람을 SSE(Server-Sent Events)로 전송합니다.
   *     tags:
   *       - Alarm
   *     responses:
   *       200:
   *         description: 실시간 알람 스트림
   *         content:
   *           text/event-stream:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Alarm'
   */
  router.get(
    '/sse',
    passport.authenticate('jwt', { session: false }),
    notificationController.sseConnect
  );

  /**
   * @swagger
   * /api/notifications:
   *   get:
   *     summary: 알람 조회(UserType에 따른 알람 조회)
   *     description: 유저 타입에 따라 알람 목록을 조회합니다.
   *     tags:
   *       - Alarm
   *     responses:
   *       200:
   *         description: 알람 목록 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Alarm'
   *       400:
   *         description: 잘못된 요청입니다
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error400'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error401'
   *       403:
   *         description: 접근 권한 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error403'
   *       404:
   *         description: 알람을 찾지 못함
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error404'
   */
  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    notificationController.getNotifications
  );

  /**
   * @swagger
   * /api/notifications/{alarmId}/check:
   *   patch:
   *     summary: 알람 읽음 처리
   *     description: 특정 알람을 읽음 처리합니다.
   *     tags:
   *       - Alarm
   *     parameters:
   *       - in: path
   *         name: alarmId
   *         required: true
   *         description: 읽음 처리할 알람 ID
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 알람 읽음 처리 완료
   *       400:
   *         description: 잘못된 요청입니다
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error400'
   *       401:
   *         description: 인증 실패
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error401'
   *       403:
   *         description: 접근 권한 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error403'
   *       404:
   *         description: 알람을 찾을 수 없음
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error404'
   */
  router.patch(
    '/:alarmId/check',
    passport.authenticate('jwt', { session: false }),
    notificationController.checkNotification
  );

  return router;
};

export default NotificationRouter;
