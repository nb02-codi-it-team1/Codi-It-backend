import { ConflictError } from 'src/common/errors/error-type';
import { CreateStoreDto } from './dtos/create.dto';
import StoreRepository from './stores.repository';
import { StoreResponseDto } from './dtos/response.dto';

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
}
