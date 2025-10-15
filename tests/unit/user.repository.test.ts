import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, Prisma, UserType } from '@prisma/client';
import UserRepository from '../../src/users/user.repository';

describe('UserRepository Unit Test', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repository: UserRepository;

  type UserWithGrade = Prisma.UserGetPayload<{ include: { grade: true } }>;
  type StoreLikeWithStore = Prisma.StoreLikeGetPayload<{ include: { store: true } }>;

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
    type: UserType.BUYER,
    gradeid: 'grade_green',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    grade,
  };

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repository = new UserRepository(prisma as unknown as PrismaClient);
    jest.clearAllMocks();
  });

  test('findByEmail - 이메일로 사용자 조회', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await repository.findByEmail(user.email);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: user.email },
    });
    expect(result).toEqual(user);
  });

  test('findByEmail - 결과 없음이면 null 반환', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await repository.findByEmail('notfound@test.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'notfound@test.com' },
    });
    expect(result).toBeNull();
  });

  test('create - 유저 생성 시 grade 포함 반환', async () => {
    prisma.user.create.mockResolvedValue(user);

    const result = await repository.create({
      name: user.name,
      email: user.email,
      password: user.password,
      type: user.type,
      grade: { connect: { id: grade.id } },
    });

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.any(Object),
      include: { grade: true },
    });
    expect(result).toEqual(user);
  });

  test('getUserById - 아이디로 조회', async () => {
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await repository.getUserById(user.id);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: user.id },
      include: { grade: true },
    });
    expect(result).toEqual(user);
  });

  test('updateUser - 유저 업데이트', async () => {
    const updated: UserWithGrade = { ...user, name: '변경됨' };
    prisma.user.update.mockResolvedValue(updated);

    const result = await repository.updateUser(user.id, { name: '변경됨' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { name: '변경됨' },
      include: { grade: true },
    });
    expect(result).toEqual(updated);
  });

  test('getUserLikedStores - 관심 스토어 반환', async () => {
    const storeLike: StoreLikeWithStore[] = [
      {
        id: 'like1',
        userId: user.id,
        storeId: 's1',
        createdAt: new Date(),
        store: {
          id: 's1',
          name: '스토어',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 'owner1',
          address: '서울시',
          detailAddress: '어딘가',
          phoneNumber: '010-1234-5678',
          content: '테스트용',
          image: 'http://example.com/store.png',
          productCount: 0,
          favoriteCount: 0,
          monthFavoriteCount: 0,
          totalSoldCount: 0,
          isDeleted: false,
        },
      },
    ];
    prisma.storeLike.findMany.mockResolvedValue(storeLike);

    const result = await repository.getUserLikedStores(user.id);

    expect(prisma.storeLike.findMany).toHaveBeenCalledWith({
      where: { userId: user.id },
      include: { store: true },
    });
    expect(result).toEqual(storeLike);
  });

  test('deleteUser - 유저 삭제', async () => {
    prisma.user.delete.mockResolvedValue(user);

    const result = await repository.deleteUser(user.id);

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: user.id },
    });
    expect(result).toEqual(user);
  });
});
