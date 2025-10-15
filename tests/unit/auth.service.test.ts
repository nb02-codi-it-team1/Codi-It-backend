import { type MockProxy, mock } from 'jest-mock-extended';
import bcrypt from 'bcrypt';
import AuthService from '../../src/auth/auth.service';
import AuthRepository from '../../src/auth/auth.repository';
import { NotFoundError, UnauthorizedError } from '../../src/common/errors/error-type';
import { LoginDto } from '../../src/auth/dtos/login.dto';

jest.mock('../../src/auth/jwt', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../src/auth/jwt';

describe('AuthService Unit Test', () => {
  let userRepository: MockProxy<AuthRepository>;
  let authService: AuthService;

  const grade = {
    id: 'grade_green',
    name: 'green',
    rate: 5,
    minAmount: 0,
  };

  const user = {
    id: 'u1',
    name: '테스터',
    email: 'test@example.com',
    password: '$2b$10$hashed',
    image: 'http://example.com/img.png',
    points: 0,
    type: 'SELLER' as const,
    gradeid: 'grade_green',
    createdAt: new Date(),
    updatedAt: new Date(),
    isDeleted: false,
    grade,
  };

  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    userRepository = mock<AuthRepository>();
    authService = new AuthService(userRepository);
    jest.clearAllMocks();
  });

  test('login - 비밀번호 일치 시 accessToken + refreshToken 발급', async () => {
    const dto: LoginDto = { email: user.email, password: '123456' };
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (generateAccessToken as jest.Mock).mockReturnValue('access.jwt');
    (generateRefreshToken as jest.Mock).mockReturnValue('refresh.jwt');

    const res = await authService.login(dto);

    expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
    expect(bcrypt.compare).toHaveBeenCalledWith(dto.password, user.password);
    expect(generateAccessToken).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
      type: user.type,
    });
    expect(generateRefreshToken).toHaveBeenCalledWith({ sub: user.id });

    expect(res).toEqual({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.points,
        image: user.image,
        grade: user.grade,
      },
      accessToken: 'access.jwt',
      refreshToken: 'refresh.jwt',
    });
  });

  test('login - 사용자 없음이면 NotFoundError', async () => {
    const dto: LoginDto = { email: 'no@user.com', password: 'plain' };
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(authService.login(dto)).rejects.toThrow(
      new NotFoundError('사용자를 찾을 수 없습니다.')
    );

    expect(userRepository.findByEmail).toHaveBeenCalledWith(dto.email);
  });

  test('login - 비밀번호 불일치면 UnauthorizedError', async () => {
    const dto: LoginDto = { email: user.email, password: 'wrong' };
    userRepository.findByEmail.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(authService.login(dto)).rejects.toThrow(
      new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.')
    );
  });

  test('refresh - 유효한 토큰 시 accessToken 재발급', async () => {
    const refresh = 'refresh.token';
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: user.id });
    userRepository.findById.mockResolvedValue(user);
    (generateAccessToken as jest.Mock).mockReturnValue('new.access.jwt');
    (generateRefreshToken as jest.Mock).mockReturnValue('new.refresh.jwt');

    const res = await authService.refresh(refresh);

    expect(verifyRefreshToken).toHaveBeenCalledWith(refresh);
    expect(userRepository.findById).toHaveBeenCalledWith(user.id);
    expect(res).toEqual({
      accessToken: 'new.access.jwt',
      refreshToken: 'new.refresh.jwt',
    });
  });

  test('refresh - verifyRefreshToken 실패 시 UnauthorizedError', async () => {
    const refresh = 'bad.token';
    (verifyRefreshToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(authService.refresh(refresh)).rejects.toThrow(
      new UnauthorizedError('토큰 재발급 실패')
    );
  });

  test('refresh - 사용자 없음 시 UnauthorizedError', async () => {
    const refresh = 'refresh.token';
    (verifyRefreshToken as jest.Mock).mockReturnValue({ sub: 'u999' });
    userRepository.findById.mockResolvedValue(null);

    await expect(authService.refresh(refresh)).rejects.toThrow(
      new UnauthorizedError('토큰 재발급 실패')
    );
  });

  test('logout - 성공 메시지 반환', async () => {
    const res = await authService.logout();
    expect(res).toEqual({ message: '성공적으로 로그아웃되었습니다.' });
  });
});
