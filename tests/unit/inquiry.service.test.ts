import { mock, MockProxy } from 'jest-mock-extended';
import { inquiryService } from 'src/inquiry/inquiry.service';
import { inquiryRepository } from 'src/inquiry/inquiry.repository';
import { NotificationService } from 'src/notification/notification.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from 'src/common/errors/error-type';
import { NotificationType } from '@prisma/client';
import { InquiryStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('src/inquiry/inquiry.repository');
jest.mock('src/notification/notification.service');

let mockInquiryRepository: MockProxy<typeof inquiryRepository>;
let mockNotificationService: MockProxy<NotificationService>;

beforeEach(() => {
  mockInquiryRepository = mock<typeof inquiryRepository>();
  mockNotificationService = mock<NotificationService>();

  (inquiryRepository as typeof mockInquiryRepository) = mockInquiryRepository;
  (NotificationService as jest.MockedClass<typeof NotificationService>) = jest
    .fn()
    .mockImplementation(() => mockNotificationService);
  jest.clearAllMocks();
});
describe('inquiryService Unit Test', () => {
  const mockStore = {
    id: 's1',
    name: 'Test Store',
    address: '123 Test St',
    detailAddress: 'Suite 100',
    phoneNumber: '010-1111-1111',
    content: 'This is a test store',
    image: 'http://example.com/image.jpg',
    userId: 'seller1',
    createdAt: new Date(),
    updatedAt: new Date(),
    productCount: 0,
    favoriteCount: 0,
    monthFavoriteCount: 0,
    totalSoldCount: 0,
    isDeleted: false,
  };

  const mockProduct = {
    id: 'p1',
    name: '예시옷',
    price: Decimal(20000),
    content: '바지야',
    image: 'https://example.com/images/skirt.jpg',
    discountRate: 10,
    discountStartTime: new Date('2025-10-01T00:00:00Z'),
    discountEndTime: new Date('2025-10-31T23:59:59Z'),
    createdAt: new Date('2025-09-01T12:00:00Z'),
    updatedAt: new Date('2025-09-15T12:00:00Z'),
    isSoldOut: false,
    storeId: 's1',
    categoryId: 'c1',
    store: mockStore,
  };

  const mockInquiryReply = {
    id: 'reply1',
    inquiryId: 'inq1',
    userId: 'seller',
    content: '답변 내용',
    createdAt: new Date('2025-10-15T10:00:00Z'),
    updatedAt: new Date('2025-10-15T10:00:00Z'),
    user: {
      id: 'seller',
      name: '판매자',
    },
  };
  const mockInquiry = {
    id: 'inq1',
    userId: 'u1',
    productId: 'p1',
    title: '문의 제목',
    content: '문의 내용입니다.',
    status: InquiryStatus.WaitingAnswer,
    isSecret: false,
    createdAt: new Date('2025-10-16T12:00:00Z'),
    updatedAt: new Date('2025-10-16T12:00:00Z'),
    user: {
      name: '홍길동',
    },
    product: {
      ...mockProduct,
      store: {
        userId: 'seller',
      },
    },
    InquiryReply: mockInquiryReply,
  };

  describe('postInquiryReply', () => {
    const userId = 'seller1';
    const inquiryId = 'inq1';
    const body = { content: '답변 내용' };

    const expectedNotification = {
      id: 'notificationId',
      userId,
      content: '새로운 알림입니다.',
      type: NotificationType.BUYER_SOLD_OUT,
      isChecked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    test('문의가 없으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(null);

      await expect(inquiryService.postInquiryReply(userId, inquiryId, body)).rejects.toThrow(
        NotFoundError
      );
    });

    test('판매자가 아니면 ForbiddenError 발생', async () => {
      const mockInquiryForForbidden = {
        ...mockInquiry,
        product: {
          ...mockInquiry.product,
          store: {
            ...mockInquiry.product.store,
            userId: '다른판매자', // userId와 다르게 설정
          },
        },
      };
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiryForForbidden);

      await expect(inquiryService.postInquiryReply(userId, inquiryId, body)).rejects.toThrow(
        ForbiddenError
      );
    });

    test('content 없으면 BadRequestError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiry);
      const userId = 'seller';
      await expect(
        inquiryService.postInquiryReply(userId, inquiryId, { content: '' })
      ).rejects.toThrow(BadRequestError);
    });

    test('정상적으로 답변 생성 및 알림 발송', async () => {
      const userId = 'seller';
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiry);
      mockInquiryRepository.createReply.mockResolvedValue(mockInquiryReply);
      mockNotificationService.createAndSendNotification.mockResolvedValue(expectedNotification);

      // 서비스 메서드 호출
      const result = await inquiryService.postInquiryReply(
        userId,
        inquiryId,
        body,
        mockNotificationService
      );

      // Repository 호출 검증
      expect(mockInquiryRepository.createReply).toHaveBeenCalledWith({
        inquiryId,
        userId,
        content: body.content,
      });

      expect(mockInquiryRepository.updateInquiryStatus).toHaveBeenCalledWith(
        inquiryId,
        'CompletedAnswer'
      );

      // NotificationService 호출 검증
      expect(mockNotificationService.createAndSendNotification).toHaveBeenCalledWith(
        mockInquiry.userId,
        expect.objectContaining({
          content: expect.stringContaining('작성하신 예시옷 문의에 대한 답변이 등록되었습니다'),
          type: NotificationType.BUYER_INQUIRY_ANSWERED,
        })
      );

      // 결과 검증
      expect(result).toHaveProperty('id', mockInquiryReply.id);
      expect(result.content).toBe(body.content);
      expect(result.user).toEqual({ id: userId, name: '판매자' });
    });
  });

  // --------------------------
  // updateReply 테스트
  // --------------------------
  describe('updateReply', () => {
    const userId = 'seller';
    const fakeUserId = 'seller1';
    const replyId = 'reply1';
    const fakeReplyId = 'reply2';
    const body = { content: '수정된 답변' };

    test('답변이 없으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findReplyByReplyId.mockResolvedValue(null);

      await expect(inquiryService.updateReply(userId, replyId, body)).rejects.toThrow(
        NotFoundError
      );
    });

    test('판매자가 아니면 ForbiddenError 발생', async () => {
      mockInquiryRepository.findReplyByReplyId.mockResolvedValue({
        ...mockInquiryReply,
        inquiry: mockInquiry,
        userId: fakeReplyId,
      });

      await expect(inquiryService.updateReply(fakeUserId, replyId, body)).rejects.toThrow(
        ForbiddenError
      );
    });

    test('content 없으면 BadRequestError 발생', async () => {
      const userId = 'seller';
      mockInquiryRepository.findReplyByReplyId.mockResolvedValue({
        ...mockInquiryReply,
        inquiry: mockInquiry,
      });

      await expect(inquiryService.updateReply(userId, replyId, { content: '' })).rejects.toThrow(
        BadRequestError
      );
    });

    test('정상적으로 답변 업데이트', async () => {
      const mockUpdateReply = {
        id: replyId,
        inquiry: mockInquiry,
        inquiryId: 'inq1',
        userId,
        content: body.content,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: { id: userId, name: '판매자' },
      };

      mockInquiryRepository.findReplyByReplyId.mockResolvedValue(mockUpdateReply);

      mockInquiryRepository.updateReply.mockResolvedValue(mockUpdateReply);

      const result = await inquiryService.updateReply(userId, replyId, body);

      expect(mockInquiryRepository.updateReply).toHaveBeenCalledWith(replyId, body);
      expect(result.content).toBe(body.content);
      expect(result.user).toEqual({ id: userId, name: '판매자' });
    });
  });

  describe('getDetailInquiry', () => {
    test('존재하지 않으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(null);
      await expect(inquiryService.getDetailInquiry('u1', 'inq1')).rejects.toThrow(NotFoundError);
    });

    test('정상 조회', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiry);
      const result = await inquiryService.getDetailInquiry('u1', 'inq1');
      expect(result.id).toBe(mockInquiry.id);
      expect(result.user.name).toBe(mockInquiry.user.name);
      expect(result.reply!.id).toBe(mockInquiryReply.id);
    });

    test('비밀 문의 권한 없으면 UnauthorizedError 발생', async () => {
      const secretInquiry = { ...mockInquiry, isSecret: true };
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(secretInquiry);
      await expect(inquiryService.getDetailInquiry('otherUser', 'inq1')).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  // --------------------------
  // getDetailReply 테스트
  // --------------------------
  describe('getDetailReply', () => {
    const replyId = 'reply1';
    const mockReply = {
      id: replyId,
      inquiryId: 'inq1',
      userId: 'seller',
      content: '답변 내용',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { name: '판매자' },
      inquiry: mockInquiry,
    };

    test('존재하지 않으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findReplyByReplyId.mockResolvedValue(null);
      await expect(inquiryService.getDetailReply('u1', replyId)).rejects.toThrow(NotFoundError);
    });

    test('정상 조회', async () => {
      mockInquiryRepository.findReplyByReplyId.mockResolvedValue(mockReply);
      const result = await inquiryService.getDetailReply('u1', replyId);
      expect(result.reply!.id).toBe(mockReply.id);
      expect(result.reply!.content).toBe(mockReply.content);
      expect(result.reply!.user.name).toBe('판매자');
    });
  });

  // --------------------------
  // updateInquiry 테스트
  // --------------------------
  describe('updateInquiry', () => {
    const updateData = { title: '수정된 제목', content: '수정된 내용' };

    test('존재하지 않으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(null);
      await expect(inquiryService.updateInquiry('u1', 'inq1', updateData)).rejects.toThrow(
        NotFoundError
      );
    });

    test('작성자가 아니면 ForbiddenError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue({
        ...mockInquiry,
        userId: 'otherUser',
      });
      await expect(inquiryService.updateInquiry('u1', 'inq1', updateData)).rejects.toThrow(
        ForbiddenError
      );
    });

    test('정상 업데이트', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiry);
      mockInquiryRepository.updateInquiry.mockResolvedValue({ ...mockInquiry, ...updateData });
      const result = await inquiryService.updateInquiry('u1', 'inq1', updateData);
      expect(result.title).toBe(updateData.title);
      expect(result.content).toBe(updateData.content);
    });
  });

  // --------------------------
  // deleteInquiry 테스트
  // --------------------------
  describe('deleteInquiry', () => {
    test('존재하지 않으면 NotFoundError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(null);
      await expect(inquiryService.deleteInquiry('u1', 'inq1')).rejects.toThrow(NotFoundError);
    });

    test('작성자가 아니면 ForbiddenError 발생', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue({
        ...mockInquiry,
        userId: 'otherUser',
      });
      await expect(inquiryService.deleteInquiry('u1', 'inq1')).rejects.toThrow(ForbiddenError);
    });

    test('정상 삭제', async () => {
      mockInquiryRepository.findInquiryByInquiryId.mockResolvedValue(mockInquiry);
      mockInquiryRepository.deleteInquiry.mockResolvedValue(mockInquiry);
      const result = await inquiryService.deleteInquiry('u1', 'inq1');
      expect(result.id).toBe(mockInquiry.id);
    });
  });
});
