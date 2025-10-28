import { PrismaClient } from '@prisma/client/extension';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { NotificationRepository } from '../../src/notification/notification.repository';
import { NotificationType } from '@prisma/client';

let mockPrisma: DeepMockProxy<PrismaClient>;
let notificationRepository: NotificationRepository;

const userId = 'user-1';
const notificationId = 'notif-1';

const expectedNotification = {
  id: notificationId,
  userId,
  content: '새로운 알림입니다.',
  type: NotificationType.BUYER_SOLD_OUT,
  isChecked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Notification Repository Unit Test', () => {
  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    notificationRepository = new NotificationRepository(mockPrisma as unknown as PrismaClient);

    jest.clearAllMocks();
  });

  test('createNotification - should correctly call create with input data', async () => {
    const createData = {
      type: NotificationType.BUYER_SOLD_OUT,
      content: '새로운 알림입니다.',
      user: { connect: { id: userId } },
    };

    mockPrisma.notification.create.mockResolvedValue(expectedNotification);

    const result = await notificationRepository.createNotification(createData);

    expect(result).toEqual(expectedNotification);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: createData,
    });
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
  });

  test('findByUserId - should return notifications for a user, sorted by creation date', async () => {
    const mockNotificationList = [expectedNotification, { ...expectedNotification, id: 'notif-b' }];

    mockPrisma.notification.findMany.mockResolvedValue(mockNotificationList);

    const result = await notificationRepository.findByUserId(userId);
    expect(result).toEqual(mockNotificationList);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    expect(mockPrisma.notification.findMany).toHaveBeenCalledTimes(1);
  });

  test('findById - should return a notification by ID', async () => {
    mockPrisma.notification.findUnique.mockResolvedValue(expectedNotification);

    const result = await notificationRepository.findById(notificationId);
    expect(result).toEqual(expectedNotification);
    expect(mockPrisma.notification.findUnique).toHaveBeenCalledWith({
      where: { id: notificationId },
    });
    expect(mockPrisma.notification.findUnique).toHaveBeenCalledTimes(1);
  });

  test('updateNotification -  should update isChecked status to true', async () => {
    const updateData = { isChecked: true };
    const updatedNotification = { ...expectedNotification, isChecked: true };

    mockPrisma.notification.update.mockResolvedValue(updatedNotification);

    const result = await notificationRepository.updateNotification(notificationId, updateData);

    expect(result).toEqual(updatedNotification);
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: notificationId },
      data: updateData,
    });
    expect(mockPrisma.notification.update).toHaveBeenCalledTimes(1);
  });
});
