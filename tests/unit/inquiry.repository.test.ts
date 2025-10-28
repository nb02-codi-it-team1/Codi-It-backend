import { inquiryRepository } from 'src/inquiry/inquiry.repository';
import prisma from 'src/common/prisma/client';
import { InquiryStatus } from '@prisma/client';

jest.mock('src/common/prisma/client', () => ({
  __esModule: true,
  default: {
    inquiry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    inquiryReply: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

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
  price: 20000,
  content: '바지야',
  image: 'https://example.com/images/skirt.jpg',
  discountRate: 10,
  discountStartTime: new Date('2025-10-01T00:00:00Z'),
  discountEndTime: new Date('2025-10-31T23:59:59Z'),
  createdAt: new Date('2025-09-01T12:00:00Z'),
  updatedAt: new Date('2025-09-15T12:00:00Z'),
  isSoldOut: false,
  store: mockStore,
};

const mockInquiryReply = {
  id: 'reply1',
  inquiryId: 'inq1',
  userId: 'seller1',
  content: '문의에 대한 답변입니다.',
  createdAt: new Date('2025-10-15T10:00:00Z'),
  updatedAt: new Date('2025-10-15T10:00:00Z'),
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
    id: 'u1',
    name: '홍길동',
    email: 'hong@test.com',
  },
  product: mockProduct,
  InquiryReply: mockInquiryReply,
};

describe('inquiryRepository', () => {
  afterEach(() => jest.clearAllMocks());

  test('findInquiriesBySellerId 호출 확인', async () => {
    (prisma.inquiry.findMany as jest.Mock).mockResolvedValue(mockInquiry);

    const result = await inquiryRepository.findInquiriesBySellerId('seller1', {
      skip: 0,
      take: 10,
      status: InquiryStatus.WaitingAnswer,
    });

    expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          product: expect.objectContaining({
            store: expect.objectContaining({ userId: 'seller1' }),
          }),
          status: InquiryStatus.WaitingAnswer,
        }),
        skip: 0,
        take: 10,
      })
    );
    expect(result).toEqual(mockInquiry);
  });
});

test('findMyInquiryByUserId 호출 확인', async () => {
  (prisma.inquiry.findMany as jest.Mock).mockResolvedValue(mockInquiry);

  const result = await inquiryRepository.findMyInquiryByUserId('u1', {
    skip: 0,
    take: 10,
  });

  expect(prisma.inquiry.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { userId: 'u1' },
      skip: 0,
      take: 10,
    })
  );
  expect(result).toEqual(mockInquiry);
});

test('countInquiryByUserId 호출 확인', async () => {
  (prisma.inquiry.count as jest.Mock).mockResolvedValue(5);

  const result = await inquiryRepository.countInquiryByUserId('u1', {});
  expect(prisma.inquiry.count).toHaveBeenCalledWith({
    where: { userId: 'u1' },
  });
  expect(result).toBe(5);
});

test('countInquiriesBySellerId 호출 확인', async () => {
  (prisma.inquiry.count as jest.Mock).mockResolvedValue(3);

  const result = await inquiryRepository.countInquiriesBySellerId('seller1', {});
  expect(prisma.inquiry.count).toHaveBeenCalledWith({
    where: {
      product: { store: { userId: 'seller1' } },
    },
  });
  expect(result).toBe(3);
});

test('findInquiryByInquiryId 호출 확인', async () => {
  (prisma.inquiry.findUnique as jest.Mock).mockResolvedValue({ id: 'inq1' });

  await inquiryRepository.findInquiryByInquiryId('inq1');
  expect(prisma.inquiry.findUnique).toHaveBeenCalledWith({
    where: { id: 'inq1' },
    include: expect.objectContaining({
      user: expect.any(Object),
      InquiryReply: expect.any(Object),
      product: expect.any(Object),
    }),
  });
});

test('updateInquiry 호출 확인', async () => {
  const data = {
    title: '수정된 제목',
    content: '수정내용',
  };

  (prisma.inquiry.update as jest.Mock).mockResolvedValue({
    data,
  });

  await inquiryRepository.updateInquiry('inq1', data);

  expect(prisma.inquiry.update).toHaveBeenCalledWith({
    where: { id: 'inq1' },
    data,
  });
});

test('deleteInquiry 호출 확인', async () => {
  (prisma.inquiry.delete as jest.Mock).mockResolvedValue({ id: 'inq1' });

  await inquiryRepository.deleteInquiry('inq1');
  expect(prisma.inquiry.delete).toHaveBeenCalledWith({
    where: { id: 'inq1' },
  });
});

test('createReply 호출 확인', async () => {
  (prisma.inquiryReply.create as jest.Mock).mockResolvedValue({ id: 'reply1' });

  const data = { inquiryId: 'inq1', userId: 'u1', content: '답변내용' };
  await inquiryRepository.createReply(data);

  expect(prisma.inquiryReply.create).toHaveBeenCalledWith({
    data: {
      content: '답변내용',
      inquiry: { connect: { id: 'inq1' } },
      user: { connect: { id: 'u1' } },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });
});

test('updateInquiryStatus 호출 확인', async () => {
  (prisma.inquiry.update as jest.Mock).mockResolvedValue({ id: 'inq1' });

  await inquiryRepository.updateInquiryStatus('inq1', InquiryStatus.CompletedAnswer);

  expect(prisma.inquiry.update).toHaveBeenCalledWith({
    where: { id: 'inq1' },
    data: { status: InquiryStatus.CompletedAnswer },
  });
});

test('findReplyByReplyId 호출 확인', async () => {
  (prisma.inquiryReply.findUnique as jest.Mock).mockResolvedValue({ id: 'reply1' });

  await inquiryRepository.findReplyByReplyId('reply1');
  expect(prisma.inquiryReply.findUnique).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { id: 'reply1' },
      include: expect.objectContaining({
        user: expect.any(Object),
        inquiry: expect.any(Object),
      }),
    })
  );
});

test('updateReply 호출 확인', async () => {
  const replyData = {
    content: '수정된 답변',
  };

  (prisma.inquiryReply.update as jest.Mock).mockResolvedValue({ id: 'reply1' });

  await inquiryRepository.updateReply('reply1', replyData);
  expect(prisma.inquiryReply.update).toHaveBeenCalledWith({
    where: { id: 'reply1' },
    data: { content: '수정된 답변' },
    include: { user: { select: { id: true, name: true } } },
  });
});
