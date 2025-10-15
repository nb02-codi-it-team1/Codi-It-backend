import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Prisma } from '@prisma/client';
import AuthRepository from '../../src/auth/auth.repository';

describe('AuthRepository Unit Test', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repository: AuthRepository;

  type UserWithGrade = Prisma.UserGetPayload<{ include: { grade: true } }>;

  const grade = {
    id: 'grade_green',
    name: 'green',
    rate: 5,
    minAmount: 0,
  };

  const user: UserWithGrade = {
    id: 'u1',
    name: '테스터',
    email: 'test@example.com',
    password: '$2b$10$hashed',
    image: 'http://example.com/img.png',
    points: 0,
    type: 'BUYER',
    gradeid: 'grade_green',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    grade,
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repository = new AuthRepository(prisma as unknown as PrismaClient);
    jest.clearAllMocks();
  });

  test('findByEmail - 이메일로 사용자 조회 + grade 포함', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await repository.findByEmail(user.email);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: user.email },
      include: { grade: true },
    });
    expect(result).toEqual(user);
  });

  test('findByEmail - 결과 없음이면 null', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await repository.findByEmail('notfound@test.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'notfound@test.com' },
      include: { grade: true },
    });
    expect(result).toBeNull();
  });

  test('findById - 아이디로 사용자 조회 + grade 포함', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await repository.findById(user.id);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      include: { grade: true },
    });
    expect(result).toEqual(user);
  });

  test('findById - 결과 없음이면 null', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await repository.findById('notfound');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'notfound' },
      include: { grade: true },
    });
    expect(result).toBeNull();
  });
});
