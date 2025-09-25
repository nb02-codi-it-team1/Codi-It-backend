import { NextFunction, Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { plainToInstance } from 'class-transformer';
import { NotificationResponseDto } from './dto/response.dto';

export class NotificationController {
  private readonly notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  sseConnect = (req: Request, res: Response) => {
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache',
      connection: 'keep-alive',
    });

    const removeClient = this.notificationService.addClient(res);

    req.on('close', () => {
      removeClient();
    });
  };

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
      const notifications = await this.notificationService.getNotifications(userId);
      const notificationsResponse = plainToInstance(NotificationResponseDto, notifications, {
        excludeExtraneousValues: true,
      });
      res.status(200).json(notificationsResponse);
    } catch (error) {
      return next(error);
    }
  };

  checkNotification = async (req: Request, res: Response, next: NextFunction) => {
    const { alarmId } = req.params;
    if (!alarmId || typeof alarmId !== 'string') {
      return res.status(400).json({ message: 'Alarm ID is required.' });
    }
    try {
      await this.notificationService.checkNotification(alarmId);
      res.status(200).send();
    } catch (error) {
      return next(error);
    }
  };
}
