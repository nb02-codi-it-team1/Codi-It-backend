import { NextFunction, Request, Response } from 'express';
import StoreService from './stores.service';
import { CreateStoreDto } from './dtos/create.dto';
import { plainToInstance } from 'class-transformer';
import { StoreResponseDto } from './dtos/response.dto';
import { DetailResponseDto } from './dtos/detail-response.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { StoreLikeResponseDto } from './dtos/store-like-response.dto';
import { MyStoreResponseDto } from './dtos/my-store-response.dto';

export default class StoreController {
  private readonly storeService: StoreService;

  constructor(storeService: StoreService) {
    this.storeService = storeService;
  }

  createStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.id);
      const storeData: CreateStoreDto = req.body;

      if (!userId) {
        return res.status(401).json({ message: '권한이 없습니다.' });
      }
      const newStore = await this.storeService.createStore(userId, storeData);
      const storeResponse = plainToInstance(StoreResponseDto, newStore, {
        excludeExtraneousValues: true,
      });
      return res.status(201).json(storeResponse);
    } catch (error) {
      return next(error);
    }
  };

  updateStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = String(req.params.storeId);
      const userId = String(req.user?.id);
      const data = req.body;

      if (!userId) {
        return res.status(401).json({ message: '권한이 없습니다.' });
      }
      const updatedStore = await this.storeService.updateStore(storeId, userId, data);
      const updateResponse = plainToInstance(StoreResponseDto, updatedStore, {
        excludeExtraneousValues: true,
      });
      return res.status(200).json(updateResponse);
    } catch (error) {
      return next(error);
    }
  };

  getStoreDetails = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = String(req.params.storeId);

      const store = await this.storeService.getStoreById(storeId);
      const storeResponse = plainToInstance(DetailResponseDto, store, {
        excludeExtraneousValues: true,
      });
      return res.status(200).json(storeResponse);
    } catch (error) {
      return next(error);
    }
  };

  getMyStore = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.id);

      if (!userId) {
        return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });
      }

      const mystore = await this.storeService.getMyStore(userId);
      const mystoreResponse = plainToInstance(MyStoreResponseDto, mystore, {
        excludeExtraneousValues: true,
      });
      return res.status(200).json(mystoreResponse);
    } catch (error) {
      return next(error);
    }
  };

  getMyStoreProducts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.id);
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 10;

      const { list, totalCount } = await this.storeService.getMyStoreProducts(
        userId,
        page,
        pageSize
      );

      const productListResponse = plainToInstance(ProductResponseDto, list, {
        excludeExtraneousValues: true,
      });

      return res.status(200).json({
        list: productListResponse, // DTO 변환된 리스트
        totalCount: totalCount, // 전체 개수
      });
    } catch (error) {
      return next(error);
    }
  };

  registerStoreLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.id);
      const storeId = String(req.params.storeId);

      const storeLike = await this.storeService.registerStoreLike(userId, storeId);
      const storeLikeResponse = plainToInstance(StoreLikeResponseDto, storeLike, {
        excludeExtraneousValues: true,
      });
      return res.status(200).json(storeLikeResponse);
    } catch (error) {
      return next(error);
    }
  };

  deleteStoreLike = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = String(req.user?.id);
      const storeId = String(req.params.storeId);

      const deleteLike = await this.storeService.deleteStoreLike(userId, storeId);
      const deleteLikeResponse = plainToInstance(StoreLikeResponseDto, deleteLike, {
        excludeExtraneousValues: true,
      });
      return res.status(200).json(deleteLikeResponse);
    } catch (error) {
      return next(error);
    }
  };
}
