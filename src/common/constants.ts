import dotenv from 'dotenv';
import { InternalServerError } from '../common/errors/error-type';

if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.prod' });
} else {
  dotenv.config({ path: '.env.dev' });
}

function requireEnv(env: string): string {
  const envValue = process.env[env];
  if (!envValue) {
    throw new InternalServerError(`환경 변수 ${env}가 설정되지 않았습니다.`);
  }
  return envValue;
}

export const PORT = Number(process.env.PORT || 3000);
export const JWT_ACCESS_SECRET = requireEnv('JWT_ACCESS_SECRET');
export const JWT_REFRESH_SECRET = requireEnv('JWT_REFRESH_SECRET');
export const AWS_REGION = requireEnv('AWS_REGION');
export const AWS_ACCESS_KEY_ID = requireEnv('AWS_ACCESS_KEY_ID');
export const AWS_SECRET_ACCESS_KEY = requireEnv('AWS_SECRET_ACCESS_KEY');
export const AWS_BUCKET_NAME = requireEnv('AWS_BUCKET_NAME');
export const COOKIE_SECURE = requireEnv('COOKIE_SECURE') === 'true';
export const COOKIE_SAMESITE = requireEnv('COOKIE_SAMESITE') as 'lax' | 'none';
