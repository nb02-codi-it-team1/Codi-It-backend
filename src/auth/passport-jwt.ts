import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import passport from 'passport';
import AuthRepository from './auth.repository';
import { Request } from 'express';
import prisma from '../common/prisma/client';
import { UserType } from '@prisma/client';
import { JWT_ACCESS_SECRET } from '../common/constants';

const authRepository = new AuthRepository(prisma);

export interface JwtPayload {
  sub: string;
  email: string;
  type: UserType;
  iat?: number;
  exp?: number;
}

// AccessToken 추출 함수
const extractor = (req: Request): string | null => {
  // 쿠키에서 꺼내기
  const fromCookie = req?.cookies?.accessToken ?? null;
  if (fromCookie) return fromCookie;

  // 헤더에서 꺼내기
  const fromHeader = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  return fromHeader ?? null;
};

// 사용자 인증
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: extractor,
      secretOrKey: JWT_ACCESS_SECRET,
    },
    async (payload: JwtPayload, done) => {
      try {
        const user = await authRepository.findById(payload.sub);

        if (!user) return done(null, false);

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
