import { plainToInstance } from 'class-transformer';
import { CreateNotificationDto } from './dto/create.dto';
import { NotificationResponseDto } from './dto/response.dto';
import { NotificationRepository } from './notification.repository';

type SseClient = import('express').Response;

export class NotificationService {
  private readonly notificationRepository: NotificationRepository;
  private readonly clients = new Set<SseClient>();

  constructor(notificationRepository: NotificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  addClient(res: SseClient): () => void {
    this.clients.add(res);
    console.log(`새로운 SSE 클라이언트 연결`);

    return () => {
      this.clients.delete(res);
      console.log(`SSE 클라이언트 연결 종료`);
    };
  }

  async createAndSendNotification(
    userId: string,
    dto: CreateNotificationDto
  ): Promise<NotificationResponseDto> {
    const newNotification = await this.notificationRepository.createNotification({
      user: {
        connect: {
          id: userId,
        },
      },
      type: dto.type,
      content: dto.content,
    });

    const data = JSON.stringify(newNotification);
    this.clients.forEach((client) => {
      client.write(`id: ${newNotification.id}\n`);
      client.write(`event: new_notification\n`);
      client.write(`data: ${data}\n\n`);
    });

    return plainToInstance(NotificationResponseDto, newNotification);
  }

  async getNotifications(userId: string): Promise<NotificationResponseDto[]> {
    const notificationList = await this.notificationRepository.findByUserId(userId);
    return plainToInstance(NotificationResponseDto, notificationList);
  }

  async checkNotification(id: string): Promise<NotificationResponseDto> {
    const checkNotification = await this.notificationRepository.updateNotification(id, {
      isChecked: true,
    });
    return plainToInstance(NotificationResponseDto, checkNotification);
  }
}
