import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import StoreRepository from './stores.repository';
import StoreService from './stores.service';
import StoreController from './stores.controller';
import validateDto from '../common/utils/validate.dto';
import { CreateStoreDto } from './dtos/create.dto';
import { UpdateStoreDto } from './dtos/update.dto';
import upload from '../middleware/upload';

const StoresRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const storeRepository = new StoreRepository(prisma);
  const storeService = new StoreService(storeRepository);
  const storeController = new StoreController(storeService);

  router.post(
    '/',
    upload.single('image'),
    validateDto(CreateStoreDto),
    storeController.createStore
  );
  router.patch(
    '/:storeId',
    upload.single('image'),
    validateDto(UpdateStoreDto),
    storeController.updateStore
  );
  router.get('/:storeId', storeController.getStoreDetails);
  router.get('/detail/my', storeController.getMyStore);
  router.get('/detail/my/product', storeController.getMyStoreProducts);
  router.post('/:storeId/favorite', storeController.registerStoreLike);
  router.delete('/:storeId/favorite', storeController.deleteStoreLike);

  return router;
};

export default StoresRouter;
