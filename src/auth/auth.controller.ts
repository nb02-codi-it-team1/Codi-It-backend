import { Request, Response, NextFunction } from 'express';
import AuthService from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { UnauthorizedError } from '../common/errors/error-type';
import { COOKIE_SECURE, COOKIE_SAMESITE } from '../common/constants';

export default class AuthController {
  private readonly authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  // 로그인
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: LoginDto = req.body;
      const response = await this.authService.login(data);

      // 토큰을 쿠키에 저장
      res.cookie('refreshToken', response.refreshToken, {
        httpOnly: true,
        secure: COOKIE_SECURE,
        sameSite: COOKIE_SAMESITE,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      res.status(201).json({
        user: response.user,
        accessToken: response.accessToken,
      });
    } catch (error) {
      next(error);
    }
  };

  // 토큰 재발급
  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) throw new UnauthorizedError('RefreshToken이 없습니다.');

      const response = await this.authService.refresh(refreshToken);

      // 새 RefreshToken을 쿠키에 저장
      res.cookie('refreshToken', response.refreshToken, {
        httpOnly: true,
        secure: false, // HTTPS 환경이라면 true
        sameSite: 'lax', // HTTPS 환경이라면 'none'
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      });

      res.status(200).json({ accessToken: response.accessToken });
    } catch (error) {
      next(error);
    }
  };

  // 로그아웃
  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.authService.logout();

      // RefreshToken 쿠키 제거
      res.clearCookie('refreshToken');

      res.status(200).json({ message: '성공적으로 로그아웃되었습니다.' });
    } catch (error) {
      next(error);
    }
  };
}
