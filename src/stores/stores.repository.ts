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
  async findById(id: string) {
    return this.prisma.store.findUnique({
      where: { id, isDeleted: false },
    });
  }

  async updateStore(id: string, userId: string, data: Prisma.StoreUpdateInput) {
    return this.prisma.store.update({
      where: { id, userId },
      data,
    });
  }
}
