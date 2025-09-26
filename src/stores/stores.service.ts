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

  async createStore(userId: string, data: CreateStoreDto): Promise<StoreResponseDto> {
    const trimmedName = data.name.trim();
    const existingStore = await this.storeRepository.findByName(trimmedName);
    if (existingStore) {
      throw new ConflictError('이미 존재하는 스토어 이름입니다.');
    }

    const storeInfo = {
      ...data,
      name: trimmedName,
      user: {
        connect: { id: userId },
      },
    };

    if (!storeInfo.image) {
      storeInfo.image = 'wwww.sample.png'; // 기본 이미지 설정
    }
    const newStore = await this.storeRepository.createStore(storeInfo);

    return plainToInstance(StoreResponseDto, newStore);
  }

  async updateStore(
    storeId: string,
    userId: string,
    data: UpdateStoreDto
  ): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findById(storeId);
    if (!existingStore) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }
    if (existingStore.userId !== userId) {
      throw new UnauthorizedError('권한이 없습니다.');
    }

    const updateData = { ...data };
    if (updateData.name) {
      updateData.name = updateData.name.trim();
    }

    if (updateData.name && updateData.name !== existingStore.name) {
      const nameExists = await this.storeRepository.findByName(updateData.name);
      if (nameExists) {
        throw new ConflictError('이미 존재하는 스토어 이름입니다.');
      }
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

  async getMyStore(userId: string): Promise<MyStoreResponseDto> {
    const mystore = await this.storeRepository.findMyStore(userId);
    if (!mystore) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }

    return plainToInstance(MyStoreResponseDto, mystore);
  }

  async getMyStoreProducts(
    userId: string,
    page: number,
    pageSize: number
  ): Promise<MyStoreProductResponseDto> {
    const productsWithStock = await this.storeRepository.findMyStoreProducts(
      userId,
      page,
      pageSize
    );
    const totalCount = await this.storeRepository.countMyStoreProducts(userId);

    const productInfo = productsWithStock.map((product) => {
      const stock = product.Stock.reduce((sum, current) => sum + current.quantity, 0);
      const isDiscount =
        (product.discountRate ?? 0) > 0 &&
        product.discountEndTime !== null &&
        product.discountEndTime > new Date();

      return {
        ...product,
        stock,
        isDiscount,
        Stock: undefined,
      };
    });

    const list = plainToInstance(ProductResponseDto, productInfo);
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

    const existingStoreLike = await this.storeRepository.storeLikeCheck(userId, storeId);
    if (!existingStoreLike) {
      await this.storeRepository.createStoreLike(userId, storeId);
      await this.storeRepository.increaseLikeCount(storeId);
    }

    const updatedLikeStore = await this.storeRepository.findById(storeId);
    const type = 'register';
    const store = plainToInstance(StoreResponseDto, updatedLikeStore);
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

    const existingStoreLike = await this.storeRepository.storeLikeCheck(userId, storeId);
    if (existingStoreLike) {
      await this.storeRepository.deleteStroeLike(userId, storeId);
      await this.storeRepository.decreaseLikeCount(storeId);
    }

    const updatedLikeStore = await this.storeRepository.findById(storeId);
    const type = 'delete';
    const store = plainToInstance(StoreResponseDto, updatedLikeStore);

    return {
      type,
      store,
    };
  }
}
