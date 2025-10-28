import { Category, Grade, Prisma, Size } from '@prisma/client';
import { PrismaClient } from '@prisma/client/extension';

export default class MetadataRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async getSizes(): Promise<Size[]> {
    return this.prisma.size.findMany({
      select: {
        id: true,
        name: true,
        ko: true,
        en: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async getGrades(): Promise<Grade[]> {
    return this.prisma.grade.findMany({
      select: {
        name: true,
        id: true,
        rate: true,
        minAmount: true,
      },
      orderBy: { id: 'asc' },
    });
  }
  async getCategory(name?: string): Promise<Category[]> {
    if (!name || typeof name !== 'string') {
      return [];
    }
    const whereCondition = { name: { contains: name.toUpperCase(), mode: 'insensitive' } };
    return this.prisma.category.findMany({
      select: {
        name: true,
        id: true,
      },
      where: whereCondition,
      orderBy: { id: 'asc' },
    });
  }
}
