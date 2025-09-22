import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors/error-type';
import { UserType } from '@prisma/client';

interface AuthUser {
  id: string;
  email: string;
  type: UserType;
}

// 판매자만 허용
export const authorizeSeller = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;

  if (!user) {
    return next(new ForbiddenError('로그인이 필요합니다.'));
  }

  if (user.type !== 'SELLER') {
    return next(new ForbiddenError('판매자 권한이 필요합니다.'));
  }

  return next();
};

// 구매자만 허용
export const authorizeBuyer = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as AuthUser | undefined;

  if (!user) {
    return next(new ForbiddenError('로그인이 필요합니다.'));
  }

  if (user.type !== 'BUYER') {
    return next(new ForbiddenError('구매자 권한이 필요합니다.'));
  }

  return next();
};
