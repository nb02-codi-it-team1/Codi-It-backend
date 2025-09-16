import { HttpError } from '../errors/error-type';

export const isErrorInstanceOfHttp = (error: unknown): error is HttpError =>
  error instanceof HttpError;
export const isErrorInstanceOfNode = (error: unknown): error is Error => error instanceof Error;
