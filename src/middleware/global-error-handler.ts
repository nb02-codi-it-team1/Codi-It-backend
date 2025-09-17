import { ErrorRequestHandler, NextFunction, Request, Response } from 'express';
import { isErrorInstanceOfHttp, isErrorInstanceOfNode } from '../../src/common/utils/error-util';

import { getIp, getMethod, getUrl } from '../../src/common/utils/from-util';

export const globalErrorHandler: ErrorRequestHandler = async (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let status = 500;
  let message = 'Internal Server Error';

  if (isErrorInstanceOfHttp(error)) {
    status = error.status;
    message = error.message;
  } else if (isErrorInstanceOfNode(error)) {
    status = 500;
    message = error.message;
  }

  console.error({
    ip: getIp(req),
    method: getMethod(req),
    url: getUrl(req),
    statusCode: String(status),
    createdAt: new Date(),
  });

  const response = {
    success: false,
    error: {
      status,
      message,
    },
  };

  res.status(status).json(response);
};
