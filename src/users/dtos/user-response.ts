import { UserType } from '@prisma/client';

export interface GradeResponseDto {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
}

export interface UserMapperDto {
  id: string;
  name: string;
  email: string;
  password: string;
  type: UserType;
  points: number | null;
  createdAt: Date;
  updatedAt: Date;
  grade: GradeResponseDto;
  image: string | null;
}

export class UserMapper {
  static toUserResponse(user: UserMapperDto) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      type: user.type,
      points: user.points,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      grade: user.grade,
      image: user.image,
    };
  }
}
