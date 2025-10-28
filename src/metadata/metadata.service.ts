import { Category } from '@prisma/client';
import MetadataRepository from './metadata.repository';

interface SizeResponse {
  id: number;
  name: string;
  size: {
    en: string;
    ko: string;
  };
}

interface GradeResponse {
  id: string;
  name: string;
  rate: number;
  minAmount: number;
}

export default class MetadataService {
  private readonly metadataRepository: MetadataRepository;

  constructor(metadataRepository: MetadataRepository) {
    this.metadataRepository = metadataRepository;
  }

  async getSizes(): Promise<SizeResponse[]> {
    const sizes = await this.metadataRepository.getSizes();

    return sizes.map((size) => ({
      id: size.id,
      name: size.name,
      size: {
        en: size.en,
        ko: size.ko,
      },
    }));
  }

  async getGrades(): Promise<GradeResponse[]> {
    const grades = await this.metadataRepository.getGrades();

    return grades.map((grade) => ({
      id: grade.id,
      name: grade.name,
      rate: grade.rate,
      minAmount: grade.minAmount,
    }));
  }

  async getCategories(name?: string): Promise<Category[]> {
    return this.metadataRepository.getCategory(name);
  }
}
