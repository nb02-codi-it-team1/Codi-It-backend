import { MockProxy, mock } from 'jest-mock-extended';
import { NotificationRepository } from 'src/notification/notification.repository';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationType } from '@prisma/client';
import { CreateNotificationDto } from 'src/notification/dto/create.dto';
import { plainToInstance } from 'class-transformer';
import { NotificationResponseDto } from 'src/notification/dto/response.dto';

type MockSseClient = MockProxy<import('express').Response>;

const userId = 'user-1';
const notificationId = 'notif-1';

const dbNotification = {
  id: notificationId,
  userId,
  content: '알림 test',
  type: NotificationType.BUYER_SOLD_OUT,
  size: 's',
  isChecked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Notification Service Unit Test', () => {
  let notificationRepository: MockProxy<NotificationRepository>;
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationRepository = mock<NotificationRepository>();
    notificationService = new NotificationService(notificationRepository);

    jest.clearAllMocks();
  });

  test('addClient - should add a client and return a cleanup function', async () => {
    const mockRes = mock<MockSseClient>();

    const cleanup = notificationService.addClient(mockRes);

    cleanup();
    expect(cleanup).toBeInstanceOf(Function);
  });

  test('createAndSendNotification - should create notification, send SSE, and return DTO ', async () => {
    const dto: CreateNotificationDto = {
      type: NotificationType.BUYER_SOLD_OUT,
      content: '상품',
      size: 's',
    };

    notificationRepository.createNotification.mockResolvedValue(dbNotification);

    const mockClient: MockSseClient = mock<MockSseClient>();
    notificationService.addClient(mockClient);

    const result = await notificationService.createAndSendNotification(userId, dto);

    expect(notificationRepository.createNotification).toHaveBeenCalledWith({
      user: { connect: { id: userId } },
      type: dto.type,
      content: dto.content,
      size: dto.size,
    });
    const expectedData = JSON.stringify(dbNotification);
    expect(mockClient.write).toHaveBeenCalledWith(`id: ${dbNotification.id}\n`);
    expect(mockClient.write).toHaveBeenCalledWith(`event: new_notification\n`);
    expect(mockClient.write).toHaveBeenCalledWith(`data: ${expectedData}\n\n`);

    const expectedResponse = plainToInstance(NotificationResponseDto, dbNotification);
    expect(result).toEqual(expectedResponse);
  });

  test('createAndSendNotification - should rethrow error from repository and not send SSE ', async () => {
    const dto: CreateNotificationDto = {
      type: NotificationType.BUYER_SOLD_OUT,
      content: '에러 테스트',
      size: 's',
    };

    const mockError = new Error('DB 연결 실패');
    notificationRepository.createNotification.mockRejectedValue(mockError);

    const mockClient: MockSseClient = mock<MockSseClient>();
    notificationService.addClient(mockClient);

    await expect(notificationService.createAndSendNotification(userId, dto)).rejects.toThrow(
      mockError
    );

    expect(notificationRepository.createNotification).toHaveBeenCalledTimes(1);
    expect(mockClient.write).not.toHaveBeenCalled();
  });

  test('getNotifications - should fetch notifications and return as DTO List', async () => {
    const mockDbList = [dbNotification, { ...dbNotification, id: 'notif-2' }];
    notificationRepository.findByUserId.mockResolvedValue(mockDbList);

    const result = await notificationService.getNotifications(userId);

    expect(notificationRepository.findByUserId).toHaveBeenCalledWith(userId);

    const expectedResponseList = plainToInstance(NotificationResponseDto, mockDbList);
    expect(result).toEqual(expectedResponseList);
  });

  test('getNotifications - should rethrow error when repository fails to find notifications', async () => {
    const mockError = new Error('네트워크 타임아웃');
    notificationRepository.findByUserId.mockRejectedValue(mockError);

    await expect(notificationService.getNotifications(userId)).rejects.toThrow(mockError);

    expect(notificationRepository.findByUserId).toHaveBeenCalledTimes(1);
  });

  test('checkNotification - should call repository to update isChecked status to  true', async () => {
    notificationRepository.updateNotification.mockResolvedValue(dbNotification);

    await notificationService.checkNotification(notificationId);

    expect(notificationRepository.updateNotification).toHaveBeenCalledWith(notificationId, {
      isChecked: true,
    });
    expect(notificationRepository.updateNotification).toHaveBeenCalledTimes(1);
  });

  test('checkNotification - should rethrow error when repository fails to update status', async () => {
    const mockError = new Error('알림ID를 찾을 수 없음');
    notificationRepository.updateNotification.mockRejectedValue(mockError);

    await expect(notificationService.checkNotification(notificationId)).rejects.toThrow(mockError);

    expect(notificationRepository.updateNotification).toHaveBeenCalledTimes(1);
  });
});
