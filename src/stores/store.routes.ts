import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import StoreRepository from './stores.repository';
import StoreService from './stores.service';
import StoreController from './stores.controller';
import validateDto from '../common/utils/validate.dto';
import { CreateStoreDto } from './dtos/create.dto';
import { UpdateStoreDto } from './dtos/update.dto';
import { s3Upload, mapFileToBody } from '../middleware/s3-upload';
import passport from 'passport';
import { authorizeSeller, requireSellerType } from '../middleware/authorization';

const StoresRouter = (prisma: PrismaClient): Router => {
  const router = Router();

  const storeRepository = new StoreRepository(prisma);
  const storeService = new StoreService(storeRepository);
  const storeController = new StoreController(storeService);

  router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    requireSellerType,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(CreateStoreDto),
    storeController.createStore
  );
  router.patch(
    '/:storeId',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    s3Upload.single('image'),
    mapFileToBody,
    validateDto(UpdateStoreDto),
    storeController.updateStore
  );
  router.get(
    '/:storeId',
    passport.authenticate('jwt', { session: false }),
    storeController.getStoreDetails
  );
  router.get(
    '/detail/my',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    storeController.getMyStore
  );
  router.get(
    '/detail/my/product',
    passport.authenticate('jwt', { session: false }),
    authorizeSeller,
    storeController.getMyStoreProducts
  );
  router.post(
    '/:storeId/favorite',
    passport.authenticate('jwt', { session: false }),
    storeController.registerStoreLike
  );
  router.delete(
    '/:storeId/favorite',
    passport.authenticate('jwt', { session: false }),
    storeController.deleteStoreLike
  );

  return router;
};

export default StoresRouter;
