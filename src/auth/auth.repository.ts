import { PrismaClient } from '@prisma/client';

export default class AuthRepository {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { grade: true },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { grade: true },
    });
  }
}
