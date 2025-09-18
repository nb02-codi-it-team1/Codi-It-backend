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
  async findById(storeId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId, isDeleted: false },
    });
  }

  async updateStore(storeId: string, userId: string, data: Prisma.StoreUpdateInput) {
    return this.prisma.store.update({
      where: { id: storeId, userId },
      data,
    });
  }
}
