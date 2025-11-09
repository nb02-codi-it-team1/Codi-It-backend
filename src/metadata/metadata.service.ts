// src/metadata/metadata.service.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CategoryFilter =
  | 'all'
  | 'top'
  | 'bottom'
  | 'dress'
  | 'outer'
  | 'skirt'
  | 'shoes'
  | 'acc';

export default class MetadataService {
  /** 등급 목록: 프론트 GradeResponse와 동일한 필드만 선별 */
  async getGrades() {
    return prisma.grade.findMany({
      select: { id: true, name: true, rate: true, minAmount: true },
      orderBy: { minAmount: 'asc' },
    });
  }

  /** 사이즈 목록: { id, name, size: { ko, en } } 형태로 매핑 */
  async getSizes() {
    const rows = await prisma.size.findMany({
      select: { id: true, name: true, ko: true, en: true },
      orderBy: { id: 'asc' },
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      size: { ko: s.ko, en: s.en },
    }));
  }

  /** 카테고리: all이면 전체, 아니면 name 일치 항목만 */
  async getCategories(filter: CategoryFilter) {
    if (filter === 'all') {
      return prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
    }
    return prisma.category.findMany({
      where: { name: filter },
      select: { id: true, name: true },
    });
  }
}
