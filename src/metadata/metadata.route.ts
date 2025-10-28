import { PrismaClient } from '@prisma/client/extension';
import { Router } from 'express';
import MetadataRepository from './metadata.repository';
import MetadataService from './metadata.service';
import MetadataController from './metadata.controller';

const MetadataRouter = (prisma: PrismaClient) => {
  const router = Router();

  const metadataRepository = new MetadataRepository(prisma);
  const metadataService = new MetadataService(metadataRepository);
  const metadataController = new MetadataController(metadataService);

  router.get('/size', metadataController.getSizes);
  router.get('/grade', metadataController.getGrades);
  router.get('/category/:name', metadataController.getCategories);

  return router;
};

export default MetadataRouter;
