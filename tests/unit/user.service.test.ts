import { type MockProxy, mock } from 'jest-mock-extended';
import bcrypt from 'bcrypt';
import UserService from '../../src/users/user.service';
import UserRepository from '../../src/users/user.repository';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../src/common/errors/error-type';
import { Prisma, UserType } from '@prisma/client';
import { CreateUserDto } from '../../src/users/dtos/create-user.dto';
import { UpdateUserDto } from '../../src/users/dtos/update-user.dto';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('UserService Unit Test', () => {
  let userRepository: MockProxy<UserRepository>;
  let userService: UserService;

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
    userRepository = mock<UserRepository>();
    userService = new UserService(userRepository);
    jest.clearAllMocks();
  });

  test('createUser - 이메일 중복 시 ConflictError', async () => {
    userRepository.findByEmail.mockResolvedValue(user);
    const dto: CreateUserDto = {
      name: '테스터',
      email: user.email,
      password: '123456',
      type: UserType.BUYER,
    };

    await expect(userService.createUser(dto)).rejects.toThrow(ConflictError);
  });

  test('createUser - 성공 시 유저 생성', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pw');
    userRepository.create.mockResolvedValue(user);

    const dto: CreateUserDto = {
      name: '테스터',
      email: user.email,
      password: '123456',
      type: UserType.BUYER,
    };

    const result = await userService.createUser(dto);
    expect(userRepository.create).toHaveBeenCalled();
    expect(result.email).toBe(user.email);
  });

  test('getUser - 유저 없음 시 NotFoundError', async () => {
    userRepository.getUserById.mockResolvedValue(null);

    await expect(userService.getUser('u999')).rejects.toThrow(NotFoundError);
  });

  test('getUser - 유저가 존재하면 반환', async () => {
    userRepository.getUserById.mockResolvedValue(user);

    const result = await userService.getUser(user.id);
    expect(result.id).toBe(user.id);
    expect(result.email).toBe(user.email);
  });

  test('updateUser - 비밀번호 불일치 시 UnauthorizedError', async () => {
    userRepository.getUserById.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const dto: UpdateUserDto = { currentPassword: 'wrong' };

    await expect(userService.updateUser(user.id, dto)).rejects.toThrow(UnauthorizedError);
  });

  test('updateUser - 비밀번호 일치 시 업데이트 성공', async () => {
    userRepository.getUserById.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const updatedUser = { ...user, name: '업데이트된 유저' };
    userRepository.updateUser.mockResolvedValue(updatedUser);

    const dto: UpdateUserDto = { currentPassword: '123456', name: '업데이트된 유저' };

    const result = await userService.updateUser(user.id, dto);

    expect(userRepository.updateUser).toHaveBeenCalledWith(user.id, expect.any(Object));
    expect(result.name).toBe('업데이트된 유저');
  });

  test('getUserLikedStores - 결과 없음 시 NotFoundError', async () => {
    userRepository.getUserLikedStores.mockResolvedValue([]);

    await expect(userService.getUserLikedStores(user.id)).rejects.toThrow(NotFoundError);
  });

  test('getUserLikedStores - 관심 스토어가 있으면 반환', async () => {
    const likedStores: StoreLikeWithStore[] = [
      {
        id: 'like1',
        userId: user.id,
        storeId: 'store1',
        createdAt: new Date(),
        store: {
          id: 'store1',
          name: '하이버',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.id,
          address: '서울시 강남구',
          detailAddress: '역삼동',
          phoneNumber: '010-1234-5678',
          content: '테스트',
          image: 'https://example.com/store1.png',
          productCount: 0,
          favoriteCount: 0,
          monthFavoriteCount: 0,
          totalSoldCount: 0,
          isDeleted: false,
        },
      },
    ];

    userRepository.getUserLikedStores.mockResolvedValue(likedStores);

    const result = await userService.getUserLikedStores(user.id);
    expect(result).toHaveLength(1);
    expect(result[0]!.storeId).toBe('store1');
  });

  test('deleteUser - 유저 없음 시 NotFoundError', async () => {
    userRepository.getUserById.mockResolvedValue(null);

    await expect(userService.deleteUser(user.id)).rejects.toThrow(NotFoundError);
  });

  test('deleteUser - 유저 존재 시 성공 메시지 반환', async () => {
    userRepository.getUserById.mockResolvedValue(user);

    const result = await userService.deleteUser(user.id);
    expect(result).toEqual({ message: '회원 탈퇴가 완료되었습니다.' });
  });
});
