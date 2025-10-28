import { NextFunction, Request, Response } from 'express';
import { NotificationService } from './notification.service';
import { plainToInstance } from 'class-transformer';
import { NotificationResponseDto } from './dto/response.dto';
import { BadRequestError } from 'src/common/errors/error-type';

const PING_INTERVAL_MS = 30000;
const ALLOWED_ORIGIN = process.env.FRONTEND_URL || 'http://localhost:3001';

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
      'access-control-allow-origin': ALLOWED_ORIGIN,
    });

    const removeClient = this.notificationService.addClient(res);

    // 30초마다 핑(Ping) 메시지 전송
    const pingIntervalId = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, PING_INTERVAL_MS);

    req.on('close', () => {
      clearInterval(pingIntervalId);
      removeClient();
    });
  };

  getNotifications = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;

    if (!userId || typeof userId !== 'string') {
      throw new BadRequestError('User ID is required.');
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
