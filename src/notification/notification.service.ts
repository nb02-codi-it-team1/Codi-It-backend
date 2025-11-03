import { plainToInstance } from 'class-transformer';
import { CreateNotificationDto } from './dto/create.dto';
import { NotificationResponseDto } from './dto/response.dto';
import { NotificationRepository } from './notification.repository';

type SseClient = import('express').Response;

export class NotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly clients = new Map<string, SseClient>();

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  addClient(userId: string, res: SseClient): () => void {
    this.clients.set(userId, res);

    return () => {
      this.clients.delete(userId);
    };
  }

  async createAndSendNotification(
    userId: string,
    dto: CreateNotificationDto
  ): Promise<NotificationResponseDto | null> {
    let newNotification;
    try {
      newNotification = await this.notificationRepository.createNotification({
        user: {
          connect: {
            id: userId,
          },
        },
        type: dto.type,
        content: dto.content,
        size: dto.size,
      });

      const client = this.clients.get(userId);

      if (client) {
        console.log(`Notification sent to user: ${userId}`);
        const notificationToSend = plainToInstance(NotificationResponseDto, newNotification, {
          excludeExtraneousValues: true,
        });

        const data = JSON.stringify(notificationToSend);
        client.write(`id: ${newNotification.id}\n`);
        client.write(`event: message\n`);
        client.write(`data: ${data}\n\n`);
        if (client.flush) client.flush();
        console.log(`Notification sent to user: ${userId}`);
      } else {
        console.log(
          `[SSE PUSH FAIL] User ${userId} is NOT connected. Notification saved to DB only.`
        );
      }
      return plainToInstance(NotificationResponseDto, newNotification);
    } catch (error) {
      console.error(`[FATAL NOTIF ERROR] DB or Push failed for User ${userId}:`, error);
      return null;
    }
  }

  async getNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notificationList = await this.notificationRepository.findByUserId(userId);
    return plainToInstance(NotificationResponseDto, notificationList);
  }

  async checkNotification(id: string): Promise<void> {
    await this.notificationRepository.updateNotification(id, {
      isChecked: true,
    });
  }
}
