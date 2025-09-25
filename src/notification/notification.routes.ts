import { Router } from 'express';
import { NotificationRepository } from './notification.repository';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaClient } from '@prisma/client';

const NotificationRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const notificationRepository = new NotificationRepository(prisma);
  const notificationService = new NotificationService(notificationRepository);
  const notificationController = new NotificationController(notificationService);

  router.get('/sse', notificationController.sseConnect);
  router.get('/', notificationController.getNotifications);
  router.patch('/:alarmId/check', notificationController.checkNotification);

  return router;
};

export default NotificationRouter;
