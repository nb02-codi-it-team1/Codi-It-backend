import bcrypt from 'bcrypt';
import { LoginDto, LoginResponseDto } from './dtos/login.dto';
import UserRepository from './auth.repository';
import { UnauthorizedError, NotFoundError } from '../common/errors/error-type';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from './jwt';

export default class AuthService {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async login(data: LoginDto): Promise<LoginResponseDto & { refreshToken: string }> {
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) throw new NotFoundError('사용자를 찾을 수 없습니다.');

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');

    // jwt 발급
    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email,
      type: user.type,
    });

    const refreshToken = generateRefreshToken({ sub: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        type: user.type,
        points: user.points ?? 0,
        image: user.image,
        grade: user.grade,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findById(payload.sub);
      if (!user) throw new UnauthorizedError('탈퇴했거나 없는 사용자입니다.');

      // accessToken 재발급
      const accessToken = generateAccessToken({
        sub: user.id,
        email: user.email,
        type: user.type,
      });

      // 새 RefreshToken 발급
      const newRefreshToken = generateRefreshToken({ sub: user.id });

      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('JWT refresh 실패:', error);
      throw new UnauthorizedError('토큰 재발급 실패');
    }
  }

  async logout(): Promise<{ message: string }> {
    return { message: '성공적으로 로그아웃되었습니다.' };
  }
}
