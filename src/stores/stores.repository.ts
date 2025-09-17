import { Prisma, PrismaClient } from '@prisma/client';

export default class StoreRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async createStore(data: Prisma.StoreCreateInput) {
    return this.prisma.store.create({
      data,
    });
  }

  async findByName(name: string) {
    return this.prisma.store.findUnique({
      where: { name },
    });
  }
}
