import { ConflictError, NotFoundError, UnauthorizedError } from '../common/errors/error-type';
import { CreateStoreDto } from './dtos/create.dto';
import StoreRepository from './stores.repository';
import { StoreResponseDto } from './dtos/response.dto';
import { UpdateStoreDto } from './dtos/update.dto';
import { DetailResponseDto } from './dtos/detail-response.dto';
import { plainToInstance } from 'class-transformer';
import { MyStoreResponseDto } from './dtos/my-store-response.dto';
import { MyStoreProductResponseDto } from './dtos/my-store-product-response.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { StoreLikeResponseDto } from './dtos/store-like-response.dto';

export default class StoreService {
  private readonly storeRepository: StoreRepository;

  constructor(storeRepository: StoreRepository) {
    this.storeRepository = storeRepository;
  }

  async createStore(
    userId: string,
    data: CreateStoreDto,
    file?: Express.Multer.File
  ): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findByName(data.name);
    if (existingStore) {
      throw new ConflictError('이미 존재하는 스토어 이름입니다.');
    }

    const storeInfo = {
      ...data,
      user: {
        connect: { id: userId },
      },
    };

    if (file) {
      storeInfo.image = file.path;
    } else {
      storeInfo.image = 'wwww.sample.png'; // 기본 이미지 설정
    }
    const newStore = await this.storeRepository.createStore(storeInfo);

    return plainToInstance(StoreResponseDto, newStore);
  }

  async updateStore(
    storeId: string,
    userId: string,
    data: UpdateStoreDto,
    file?: Express.Multer.File
  ): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }
    if (existingStore.userId !== userId) {
      throw new UnauthorizedError('권한이 없습니다.');
    }
    const updateData = { ...data };
    if (file) {
      const newImageUrl = file.path;
      updateData.image = newImageUrl;
    }
    const updatedStore = await this.storeRepository.updateStore(storeId, userId, updateData);

    return plainToInstance(StoreResponseDto, updatedStore);
  }

  async getStoreById(storeId: string): Promise<DetailResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }

    return plainToInstance(DetailResponseDto, store);
  }

  async getMyStore(storeId: string, userId: string): Promise<MyStoreResponseDto> {
    const mystore = await this.storeRepository.findMyStore(storeId, userId);
    if (!mystore) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }

    return plainToInstance(MyStoreResponseDto, mystore);
  }

  async getMyStoreProducts(
    storeId: string,
    userId: string,
    page: number,
    pageSize: number
  ): Promise<MyStoreProductResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }

    if (store.userId !== userId) {
      throw new UnauthorizedError('접근 권한이 없습니다.');
    }

    const products = await this.storeRepository.findMyStoreProducts(storeId, page, pageSize);
    const totalCount = await this.storeRepository.countMyStoreProducts(storeId);

    const addProductInfo = await Promise.all(
      products.map(async (product) => {
        const stock = this.storeRepository.calculateStock(product.id);
        const isDiscount =
          (product.discountRate ?? 0) > 0 &&
          product.discountEndTime !== null &&
          product.discountEndTime > new Date();

        return {
          ...product,
          stock,
          isDiscount,
        };
      })
    );

    const list = plainToInstance(ProductResponseDto, addProductInfo);
    return {
      list,
      totalCount,
    };
  }

  async registerStoreLike(userId: string, storeId: string): Promise<StoreLikeResponseDto> {
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundError('상점을 찾을 수 없습니다.');
    }

    let storeInfo;

    const existingStoreLike = await this.storeRepository.storeLikeCheck(userId, storeId);
    if (!existingStoreLike) {
      const storeLike = await this.storeRepository.createStoreLike(userId, storeId);
      storeInfo = storeLike.store;
      await this.storeRepository.increaseLikeCount(storeId);
    }

    const type = 'register';
    const store = plainToInstance(StoreResponseDto, storeInfo);
    return {
      type,
      store,
    };
  }

  async deleteStoreLike(userId: string, storeId: string): Promise<StoreLikeResponseDto> {
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundError('상점을 찾을 수 없습니다.');
    }

    let storeInfo;

    const existingStoreLike = await this.storeRepository.storeLikeCheck(userId, storeId);
    if (existingStoreLike) {
      const deleteStoreLike = await this.storeRepository.deleteStroeLike(userId, storeId);
      storeInfo = deleteStoreLike.store;
      await this.storeRepository.decreaseLikeCount(storeId);
    }

    const type = 'delete';
    const store = plainToInstance(StoreResponseDto, storeInfo);

    return {
      type,
      store,
    };
  }
}
