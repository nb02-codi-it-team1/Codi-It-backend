import Prisma from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';

const prisma = new Prisma.PrismaClient();

export const productRepository = {
  create: (data: CreateProductDto) => prisma.product.create({ data }),
};
