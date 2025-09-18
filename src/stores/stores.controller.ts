import { NextFunction, Request, Response } from 'express';
import StoreService from './stores.service';
import { CreateStoreDto } from './dtos/create.dto';

export default class StoreController {
  private readonly storeService: StoreService;

  constructor(storeService: StoreService) {
    this.storeService = storeService;
  }

  createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(res.user?.userId);
      const storeData: CreateStoreDto = req.body;

      if (!userId) {
        return res.status(401).json({ message: '권한이 없습니다.' });
      }
      const newStore = await this.storeService.createStore(userId, storeData);
      return res.status(201).json(newStore);
    } catch (error) {
      return next(error);
    }
  };

  updateStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = String(req.params.storeId);
      const userId = String(res.user?.userId);
      const data = req.body;

      if (!userId) {
        return res.status(401).json({ message: '권한이 없습니다.' });
      }
      const updatedStore = await this.storeService.updateStore(storeId, userId, data);
      return res.status(200).json(updatedStore);
    } catch (error) {
      return next(error);
    }
  };

  getStoreDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = String(req.params.storeId);

      const store = await this.storeService.getStoreById(storeId);

      return res.status(200).json(store);
    } catch (error) {
      return next(error);
    }
  };

  getMyStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = String(req.params.storeId);
      const userId = String(req.user?.userId);

      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const mystore = await this.storeService.getMyStore(storeId, userId);
      return res.status(200).json(mystore);
    } catch (error) {
      return next(error);
    }
  };
}
