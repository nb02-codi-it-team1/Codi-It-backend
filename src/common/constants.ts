import dotenv from 'dotenv';

dotenv.config();

export const PORT = Number(process.env.PORT || 3000);
export const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'my-secret-access-token';
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'my-secret-refresh-token';
export const AWS_REGION = process.env.AWS_REGION || '';
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME || '';
