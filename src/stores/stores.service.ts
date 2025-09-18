import { ConflictError, NotFoundError, UnauthorizedError } from 'src/common/errors/error-type';
import { CreateStoreDto } from './dtos/create.dto';
import StoreRepository from './stores.repository';
import { StoreResponseDto } from './dtos/response.dto';
import { UpdateStoreDto } from './dtos/update.dto';

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
    return {
      id: newStore.id,
      name: newStore.name,
      createdAt: newStore.createdAt.toISOString(),
      updatedAt: newStore.updatedAt.toISOString(),
      userId: newStore.userId,
      address: newStore.address,
      detailAddress: newStore.detailAddress,
      phoneNumber: newStore.phoneNumber,
      content: newStore.content,
      image: newStore.image ?? null,
    };
  }

  async updateStore(id: string, userId: string, data: UpdateStoreDto): Promise<StoreResponseDto> {
    const existingStore = await this.storeRepository.findById(id);
    if (!existingStore) {
      throw new NotFoundError('존재하지 않는 스토어입니다.');
    }
    if (existingStore.userId !== userId) {
      throw new UnauthorizedError('권한이 없습니다.');
    }

    const updatedStore = await this.storeRepository.updateStore(id, userId, data);
    return {
      id: updatedStore.id,
      name: updatedStore.name,
      createdAt: updatedStore.createdAt.toISOString(),
      updatedAt: updatedStore.updatedAt.toISOString(),
      userId: updatedStore.userId,
      address: updatedStore.address,
      detailAddress: updatedStore.detailAddress,
      phoneNumber: updatedStore.phoneNumber,
      content: updatedStore.content,
      image: updatedStore.image ?? null,
    };
  }
}
