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
      const id = String(req.params.id);
      const userId = String(res.user?.userId);
      const storeData = req.body;

      if (!userId) {
        return res.status(401).json({ message: '권한이 없습니다.' });
      }
      const updatedStore = await this.storeService.updateStore(id, userId, storeData);
      return res.status(200).json(updatedStore);
    } catch (error) {
      return next(error);
    }
  };
}
