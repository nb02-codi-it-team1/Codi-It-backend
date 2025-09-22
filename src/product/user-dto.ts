import { UserType } from '@prisma/client'; // Prisma enum 가져오기

export interface AuthUser {
  id: string;
  gradeId: string;
  name: string;
  email: string;
  image: string;
  points?: number;
  type: UserType;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
