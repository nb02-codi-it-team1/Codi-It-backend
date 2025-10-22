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

  router.get(
    '/sse',
    passport.authenticate('jwt', { session: false }),
    notificationController.sseConnect
  );
  router.get(
    '/',
    passport.authenticate('jwt', { session: false }),
    notificationController.getNotifications
  );
  router.patch(
    '/:alarmId/check',
    passport.authenticate('jwt', { session: false }),
    notificationController.checkNotification
  );

  return router;
};

export default NotificationRouter;
