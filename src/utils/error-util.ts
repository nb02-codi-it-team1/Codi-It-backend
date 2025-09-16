import { HttpError } from '../common/errors/error-type';

export const isErrorInstanceOfHttp = (error: any): error is HttpError => error instanceof HttpError;
export const isErrorInstanceOfNode = (error: any): error is Error => error instanceof Error;