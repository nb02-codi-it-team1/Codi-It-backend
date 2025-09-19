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

  async findMyStore(storeId: string, userId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId, userId },
    });
  }

  async updateStore(storeId: string, userId: string, data: Prisma.StoreUpdateInput) {
    return this.prisma.store.update({
      where: { id: storeId, userId, isDeleted: false },
      data,
    });
  }

  async findMyStoreProducts(storeId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;

    return this.prisma.product.findMany({
      where: { storeId },
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });
  }

  async countMyStoreProducts(storeId: string): Promise<number> {
    return this.prisma.product.count({
      where: { storeId },
    });
  }

  async calculateStock(productId: string): Promise<number> {
    const result = await this.prisma.stock.aggregate({
      where: {
        productId,
      },
      _sum: {
        quantity: true,
      },
    });
    return result._sum.quantity || 0;
  }

  async storeLikeCheck(userId: string, storeId: string) {
    return this.prisma.storeLike.findFirst({
      where: { userId, storeId },
    });
  }

  async createStoreLike(userId: string, storeId: string) {
    return this.prisma.storeLike.create({
      data: { userId, storeId },
      include: { store: true },
    });
  }

  async deleteStroeLike(userId: string, storeId: string) {
    return this.prisma.storeLike.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      include: { store: true },
    });
  }
  async increaseLikeCount(storeId: string) {
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        favoriteCount: { increment: 1 },
        monthFavoriteCount: { increment: 1 },
      },
    });
  }

  async decreaseLikeCount(storeId: string) {
    return this.prisma.store.update({
      where: { id: storeId },
      data: {
        favoriteCount: { decrement: 1 },
        monthFavoriteCount: { decrement: 1 },
      },
    });
  }
}
