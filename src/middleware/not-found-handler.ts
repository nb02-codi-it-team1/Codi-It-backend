import { Request, Response, NextFunction, RequestHandler } from 'express';
import { NotFoundError } from '../common/errors/error-type';

export const notFoundHandler: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(req.originalUrl)
  const message = `요청된 페이지를 찾을 수 없습니다.`;
  next(new NotFoundError(message));
};
