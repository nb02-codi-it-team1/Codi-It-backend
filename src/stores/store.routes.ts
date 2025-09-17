import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import StoreRepository from './stores.repository';
import StoreService from './stores.service';
import StoreController from './stores.controller';
import validateDto from 'src/common/utils/validate.dto';
import { CreateStoreDto } from './dtos/create.dto';

const StoresRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const storeRepository = new StoreRepository(prisma);
  const storeService = new StoreService(storeRepository);
  const storeController = new StoreController(storeService);

  router.post('/', validateDto(CreateStoreDto), storeController.createStore);

  return router;
};

export default StoresRouter;
