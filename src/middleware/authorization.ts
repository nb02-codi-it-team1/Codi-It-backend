import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../common/errors/error-type';
import { UserType } from '@prisma/client';
import prisma from 'src/common/prisma/client';

interface AuthUser {
  id: string;
  email: string;
  type: UserType;
}

interface AuthorizedRequest extends Request {
  user?: AuthUser;
  storeId?: string;
}

// user의 Type(seller)만 체크
export const requireSellerType = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return next(new ForbiddenError('로그인이 필요합니다.'));
  }

  if (user.type !== 'SELLER') {
    return next(new ForbiddenError('판매자 권한이 필요합니다.'));
  }
  return next(); // 상점 정보 체크 없이 바로 통과
};

// 판매자만 허용
export const authorizeSeller = async (
  req: AuthorizedRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return next(new ForbiddenError('로그인이 필요합니다.'));
  }

  if (user.type !== 'SELLER') {
    return next(new ForbiddenError('판매자 권한이 필요합니다.'));
  }

  try {
    const sellerStore = await prisma.store.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!sellerStore) {
      return next(new ForbiddenError('연결된 상점 정보가 없습니다.'));
    }
    req.storeId = sellerStore.id;
    return next();
  } catch (error) {
    return next(error);
  }
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
