import { Prisma, PrismaClient } from '@prisma/client';

export default class ReviewRepository {
    private readonly prisma : PrismaClient | Prisma.TransactionClient;

    constructor (prisma: PrismaClient | Prisma.TransactionClient) {
        this.prisma = prisma;
    }
}