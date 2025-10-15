// stores.service unit test
import StoreService from '../../src/stores/stores.service';
import StoreRepository from '../../src/stores/stores.repository';
import { type MockProxy, mock } from 'jest-mock-extended';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../src/common/errors/error-type';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../../src/stores/stores.repository');

const userId = 'u1';
const storeId = 's1';
const nonexistentStoreId = 'nonexistent';
const nonexistentUserId = 'nonexistent';
const defaultStoreData = {
  id: storeId,
  userId,
  name: 'Test Store',
  address: '123 Test St',
  detailAddress: 'Suite 100',
  phoneNumber: '010-1111-1111',
  content: 'This is a test store',
  image: 'http://example.com/image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
  productCount: 0,
  favoriteCount: 0,
  monthFavoriteCount: 0,
  totalSoldCount: 0,
  isDeleted: false,
};

describe('Store-Service Unit Test', () => {
  let storeRepository: MockProxy<StoreRepository>;
  let storeService: StoreService;

  beforeEach(() => {
    storeRepository = mock<StoreRepository>();
    storeService = new StoreService(storeRepository);

    jest.clearAllMocks();
  });

  test('createStore - should create a new store', async () => {
    const storeData = {
      name: 'Test Store',
      address: '123 Test St',
      detailAddress: 'Suite 100',
      phoneNumber: '010-1111-1111',
      content: 'This is a test store',
      image: 'http://example.com/image.jpg',
    };

    const storeDataInfo = {
      name: storeData.name,
      address: storeData.address,
      detailAddress: storeData.detailAddress,
      phoneNumber: storeData.phoneNumber,
      content: storeData.content,
      image: storeData.image,
      user: { connect: { id: userId } },
    };

    storeRepository.findByName.mockResolvedValue(null);
    storeRepository.createStore.mockResolvedValue(defaultStoreData);

    const result = await storeService.createStore(userId, storeData);
    expect(result).toEqual(defaultStoreData);
    expect(storeRepository.createStore).toHaveBeenCalledWith(storeDataInfo);
  });

  test('createStore - should throw ConflictError if name already exists', async () => {
    const storeData = {
      name: 'Existing Store',
      address: '123 Test St',
      detailAddress: 'Suite 100',
      phoneNumber: '010-1111-1111',
      content: 'This is a test store',
      image: 'http://example.com/image.jpg',
    };

    storeRepository.findByName.mockResolvedValue({
      ...defaultStoreData,
      id: '2',
      userId: 'u2',
      name: 'Existing Store',
    });

    const trimmedName = storeData.name.trim();

    await expect(storeService.createStore(userId, storeData)).rejects.toThrow(
      new ConflictError('이미 존재하는 스토어 이름입니다.')
    );
    expect(storeRepository.findByName).toHaveBeenCalledWith(trimmedName);
    expect(storeRepository.createStore).not.toHaveBeenCalled();
  });

  test('createStore - should trim the store name before checking for existence and creating', async () => {
    const nameWithSpaces = ' New Store ';
    const trimmedName = nameWithSpaces.trim(); // "New Store"

    storeRepository.findByName.mockResolvedValue(null);
    storeRepository.createStore.mockResolvedValue({
      id: '3',
      userId,
      name: trimmedName,
      address: '456 New St',
      detailAddress: 'Suite 200',
      phoneNumber: '010-3333-3333',
      content: 'This is a new store',
      image: 'http://example.com/new-image.jpg',
      createdAt: new Date(),
      updatedAt: new Date(),
      productCount: 0,
      favoriteCount: 0,
      monthFavoriteCount: 0,
      totalSoldCount: 0,
      isDeleted: false,
    });

    const storeDataWithSpaces = {
      name: nameWithSpaces,
      address: '456 New St',
      detailAddress: 'Suite 200',
      phoneNumber: '010-3333-3333',
      content: 'This is a new store',
      image: 'http://example.com/new-image.jpg',
    };

    await storeService.createStore('1', storeDataWithSpaces);
    expect(storeRepository.findByName).toHaveBeenCalledWith(trimmedName);
    expect(storeRepository.createStore).toHaveBeenCalledWith(
      expect.objectContaining({
        name: trimmedName,
      })
    );
  });

  test('createStore - should use default image if image is not provided', async () => {
    const storeDataWithoutImage = {
      name: 'No Image Store',
      address: '123 Test St',
      detailAddress: 'Suite 100',
      phoneNumber: '010-1111-1111',
      image: undefined,
      content: 'No image test store',
    };

    const expectedDataWithDefaultImage = {
      ...storeDataWithoutImage,
      image: 'www.sample.png',
      user: { connect: { id: userId } },
    };

    const createStore = {
      id: '1',
      userId,
      name: 'No Image Store',
      address: '123 Test St',
      detailAddress: 'Suite 100',
      phoneNumber: '010-1111-1111',
      content: 'No image test store',
      image: 'www.sample.png',
      createdAt: new Date(),
      updatedAt: new Date(),
      productCount: 0,
      favoriteCount: 0,
      monthFavoriteCount: 0,
      totalSoldCount: 0,
      isDeleted: false,
    };

    storeRepository.findByName.mockResolvedValue(null);
    storeRepository.createStore.mockResolvedValue(createStore);

    await storeService.createStore(userId, storeDataWithoutImage);
    expect(storeRepository.createStore).toHaveBeenCalledWith(expectedDataWithDefaultImage);
    expect(storeRepository.findByName).toHaveBeenCalledTimes(1);
    expect(storeRepository.createStore).toHaveBeenCalledTimes(1);
  });

  test('updateStore - should update a store', async () => {
    const updateData = {
      name: 'Update Store',
      content: 'This is an update test store',
    };

    const updatedStore = {
      ...defaultStoreData,
      name: updateData.name,
      content: updateData.content,
      updatedAt: new Date(),
    };

    storeRepository.findById.mockResolvedValue(defaultStoreData);
    storeRepository.updateStore.mockResolvedValue(updatedStore);
    const result = await storeService.updateStore(storeId, userId, updateData);
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
    expect(storeRepository.updateStore).toHaveBeenCalledWith(storeId, userId, updateData);
    expect(result).toEqual(updatedStore);
  });

  test('updateStore - should throw an error if store not found', async () => {
    const updateData = { name: 'New Name' };

    storeRepository.findById.mockResolvedValue(null);

    await expect(storeService.updateStore(nonexistentStoreId, userId, updateData)).rejects.toThrow(
      new NotFoundError('존재하지 않는 스토어입니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(nonexistentStoreId);
    expect(storeRepository.updateStore).not.toHaveBeenCalled();
  });

  test('updateStore - should throw an error if user is not the ownner ', async () => {
    const anotherUserId = 'u2'; // 다른 사용자
    const updateData = { name: 'New Name' };

    storeRepository.findById.mockResolvedValue(defaultStoreData);
    await expect(storeService.updateStore(storeId, anotherUserId, updateData)).rejects.toThrow(
      new UnauthorizedError('권한이 없습니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
    expect(storeRepository.updateStore).not.toHaveBeenCalled();
  });

  test('updateStore - should throw an error if new name already exists', async () => {
    const newName = 'Taken Name';

    const updateData = {
      name: newName,
    };

    storeRepository.findById.mockResolvedValue(defaultStoreData);

    const conflictStore = {
      ...defaultStoreData,
      id: '2',
      userId: 'u2',
      name: newName,
    };

    storeRepository.findByName.mockResolvedValue(conflictStore);
    const trimmedName = newName.trim();
    await expect(storeService.updateStore(storeId, userId, updateData)).rejects.toThrow(
      new ConflictError('이미 존재하는 스토어 이름입니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
    expect(storeRepository.findByName).toHaveBeenCalledWith(trimmedName);
    expect(storeRepository.updateStore).not.toHaveBeenCalled();
  });

  test('getStoreById - should get a store by storeId', async () => {
    storeRepository.findById.mockResolvedValue(defaultStoreData);

    const result = await storeService.getStoreById(storeId);
    expect(result).toEqual(defaultStoreData);
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
  });

  test('getStoreById - should throw an error if store not found', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(storeService.getStoreById(nonexistentStoreId)).rejects.toThrow(
      new NotFoundError('존재하지 않는 스토어입니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(nonexistentStoreId);
  });

  test('getMyStore - should get my store by userId', async () => {
    storeRepository.findMyStore.mockResolvedValue(defaultStoreData);
    const result = await storeService.getMyStore(userId);
    expect(result).toEqual(defaultStoreData);
    expect(storeRepository.findMyStore).toHaveBeenCalledWith(userId);
  });

  test('getMyStore - should throw an error if store not found', async () => {
    storeRepository.findMyStore.mockResolvedValue(null);

    await expect(storeService.getMyStore(nonexistentUserId)).rejects.toThrow(
      new NotFoundError('존재하지 않는 스토어입니다.')
    );
    expect(storeRepository.findMyStore).toHaveBeenCalledWith(nonexistentUserId);
  });

  test('getMyStoreProducts - should get my products by userId', async () => {
    const page = 1;
    const pageSize = 10;
    const now = new Date();

    const expectedStore = {
      ...defaultStoreData,
      productCount: 2,
    };

    const mockProductsWithStock = [
      {
        id: '1',
        image: 'http://example.com/product1.jpg',
        name: 'Product 1',
        price: new Decimal(1000),
        discountRate: 0,
        discountStartTime: null,
        discountEndTime: null,
        Stock: [{ quantity: 10 }],
        isDiscount: false,
        createdAt: now,
        updatedAt: now,
        isSoldOut: false,
        content: 'test',
        storeId,
        categoryId: '1',
      },
      {
        id: '2',
        image: 'http://example.com/product2.jpg',
        name: 'Product 2',
        price: new Decimal(2000),
        discountRate: 0,
        discountStartTime: null,
        discountEndTime: null,
        Stock: [{ quantity: 20 }],
        isDiscount: false,
        createdAt: now,
        updatedAt: now,
        isSoldOut: false,
        content: 'test',
        storeId,
        categoryId: '1',
      },
    ];

    const mockTotalCount = 2;
    storeRepository.findMyStore.mockResolvedValue(expectedStore);
    storeRepository.findMyStoreProducts.mockResolvedValue(mockProductsWithStock);
    storeRepository.countMyStoreProducts.mockResolvedValue(mockTotalCount);

    const result = await storeService.getMyStoreProducts(userId, page, pageSize);

    const expectedProducts = {
      totalCount: mockTotalCount,
      list: [
        expect.objectContaining({ id: '1', stock: 10, isSoldOut: false, isDiscount: false }),
        expect.objectContaining({ id: '2', stock: 20, isSoldOut: false, isDiscount: false }),
      ],
    };

    expect(result).toEqual(expectedProducts);
    expect(storeRepository.findMyStoreProducts).toHaveBeenCalledWith(userId, page, pageSize);
    expect(storeRepository.countMyStoreProducts).toHaveBeenCalledWith(userId);
  });

  test('getMyStoreProducts - should throw an error if store not found', async () => {
    const page = 1;
    const pageSize = 10;
    storeRepository.findMyStore.mockResolvedValue(null);

    await expect(
      storeService.getMyStoreProducts(nonexistentUserId, page, pageSize)
    ).rejects.toThrow(new NotFoundError('존재하지 않는 스토어입니다.'));
    expect(storeRepository.findMyStore).toHaveBeenCalledWith(nonexistentUserId);
    expect(storeRepository.findMyStoreProducts).not.toHaveBeenCalled();
    expect(storeRepository.countMyStoreProducts).not.toHaveBeenCalled();
  });

  test('registerStoreLike - should like a store', async () => {
    const existingStore = {
      ...defaultStoreData,
      userId: 'u2',
      favoriteCount: 1,
      monthFavoriteCount: 1,
    };
    const likeData = {
      id: '1',
      userId,
      storeId,
      createdAt: new Date(),
      store: existingStore,
    };

    const updatedStore = {
      ...existingStore,
      favoriteCount: existingStore.favoriteCount + 1,
      monthFavoriteCount: existingStore.monthFavoriteCount + 1,
    };

    storeRepository.findById
      .mockResolvedValueOnce(existingStore)
      .mockResolvedValueOnce(updatedStore);

    storeRepository.increaseLikeCount.mockResolvedValue(updatedStore);
    storeRepository.createStoreLike.mockResolvedValue(likeData);
    storeRepository.storeLikeCheck.mockResolvedValue(null);

    const result = await storeService.registerStoreLike(userId, storeId);
    expect(result).toEqual({
      type: 'register',
      store: expect.objectContaining({ id: storeId }),
    });
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
    expect(storeRepository.storeLikeCheck).toHaveBeenCalledWith(userId, storeId);
    expect(storeRepository.createStoreLike).toHaveBeenCalledWith(userId, storeId);
    expect(storeRepository.increaseLikeCount).toHaveBeenCalledWith(storeId);

    expect(storeRepository.findById).toHaveBeenCalledTimes(2);
  });

  test('registerStoreLike - should throw an error if store not found ', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(storeService.registerStoreLike(userId, nonexistentStoreId)).rejects.toThrow(
      new NotFoundError('상점을 찾을 수 없습니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(nonexistentStoreId);
    expect(storeRepository.storeLikeCheck).not.toHaveBeenCalled();
    expect(storeRepository.createStoreLike).not.toHaveBeenCalled();
    expect(storeRepository.increaseLikeCount).not.toHaveBeenCalled();
  });

  test('deleteStoreLike - should unlike a store', async () => {
    const existingStore = {
      ...defaultStoreData,
      userId: 'u2',
      favoriteCount: 1,
      monthFavoriteCount: 1,
    };

    const updatedStore = {
      ...existingStore,
      favoriteCount: existingStore.favoriteCount - 1,
      monthFavoriteCount: existingStore.monthFavoriteCount - 1,
    };

    const existingLike = {
      id: '1',
      userId,
      storeId,
      createdAt: new Date(),
      store: existingStore,
    };

    storeRepository.findById
      .mockResolvedValueOnce(existingStore)
      .mockResolvedValueOnce(updatedStore);

    storeRepository.storeLikeCheck.mockResolvedValue(existingLike);
    storeRepository.deleteStoreLike.mockResolvedValue(existingLike);

    const result = await storeService.deleteStoreLike(userId, storeId);
    expect(result).toEqual({
      type: 'delete',
      store: expect.objectContaining({ id: storeId }),
    });
    expect(storeRepository.findById).toHaveBeenCalledTimes(2);
    expect(storeRepository.findById).toHaveBeenCalledWith(storeId);
    expect(storeRepository.storeLikeCheck).toHaveBeenCalledWith(userId, storeId);
    expect(storeRepository.deleteStoreLike).toHaveBeenCalledWith(userId, storeId);
    expect(storeRepository.decreaseLikeCount).toHaveBeenCalledWith(storeId);
  });

  test('deleteStoreLike - should throw an error if store not found', async () => {
    storeRepository.findById.mockResolvedValue(null);

    await expect(storeService.deleteStoreLike(userId, nonexistentStoreId)).rejects.toThrow(
      new NotFoundError('상점을 찾을 수 없습니다.')
    );
    expect(storeRepository.findById).toHaveBeenCalledWith(nonexistentStoreId);
    expect(storeRepository.storeLikeCheck).not.toHaveBeenCalled();
    expect(storeRepository.deleteStoreLike).not.toHaveBeenCalled();
    expect(storeRepository.decreaseLikeCount).not.toHaveBeenCalled();
  });

  test('deleteStoreLike - should not call decreaseLikeCount if favoriteCount is already zero', async () => {
    const storeAtZero = {
      ...defaultStoreData,
      userId: 'u2',
      favoriteCount: 0,
      monthFavoriteCount: 0,
    };

    const updatedStoreAtZero = { ...storeAtZero };

    const existingLike = {
      id: '1',
      userId,
      storeId,
      createdAt: new Date(),
      store: storeAtZero,
    };

    storeRepository.findById
      .mockResolvedValueOnce(storeAtZero)
      .mockResolvedValueOnce(updatedStoreAtZero);

    storeRepository.storeLikeCheck.mockResolvedValue(existingLike);
    storeRepository.deleteStoreLike.mockResolvedValue(existingLike);

    const result = await storeService.deleteStoreLike(userId, storeId);

    expect(storeRepository.deleteStoreLike).toHaveBeenCalledTimes(1);
    expect(storeRepository.findById).toHaveBeenCalledTimes(2);
    expect(storeRepository.decreaseLikeCount).not.toHaveBeenCalled();
    expect(result.type).toBe('delete');
  });
});
