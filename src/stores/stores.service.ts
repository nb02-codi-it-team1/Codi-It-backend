import { ConflictError, NotFoundError, UnauthorizedError } from 'src/common/errors/error-type';
import { CreateStoreDto } from './dtos/create.dto';
import StoreRepository from './stores.repository';
import { StoreResponseDto } from './dtos/response.dto';
import { UpdateStoreDto } from './dtos/update.dto';
import { DetailResponseDto } from './dtos/detail-response.dto';
import { plainToInstance } from 'class-transformer';

export default class StoreService {
  private readonly storeRepository: StoreRepository;

  constructor(storeRepository: StoreRepository) {
    this.storeRepository = storeRepository;
  }

  async createStore(userId: string, data: CreateStoreDto): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findByName(data.name);
    if (existingStore) {
      throw new ConflictError('이미 존재하는 스토어 이름입니다.');
    }

    const newStore = await this.storeRepository.createStore({
      ...data,
      user: {
        connect: { id: userId },
      },
    });
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

    const updatedStore = await this.storeRepository.updateStore(storeId, userId, data);

    return plainToInstance(StoreResponseDto, updatedStore);
  }

  async getStoreById(storeId: string): Promise<DetailResponseDto> {
    const store = await this.storeRepository.findById(storeId);
    if (!store) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }

    return plainToInstance(DetailResponseDto, store);
  }
}
