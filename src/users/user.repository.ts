import { Prisma, PrismaClient, User } from '@prisma/client';

export default class UserRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({
      data,
      include: { grade: true },
    });
  }
  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: { grade: true },
    });
  }

  async getUserLikedStores(userId: string) {
    return this.prisma.storeLike.findMany({
      where: { userId },
      include: { store: true },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
