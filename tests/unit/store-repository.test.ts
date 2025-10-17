// // store.service unit test
import { PrismaClient } from '@prisma/client/extension';
import StoreRepository from '../../src/stores/stores.repository';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { Decimal } from '@prisma/client/runtime/library';

let mockPrisma: DeepMockProxy<PrismaClient>;
let storeRepository: StoreRepository;

const userId = '1';
const storeId = 's1';
const expectedStore = {
  id: 's1',
  name: 'Test Store',
  address: '123 Test St',
  detailAddress: 'Suite 100',
  phoneNumber: '010-1111-1111',
  content: 'This is a test store',
  image: 'http://example.com/image.jpg',
  userId: '1',
  createdAt: new Date(),
  updatedAt: new Date(),
  productCount: 0,
  favoriteCount: 0,
  monthFavoriteCount: 0,
  totalSoldCount: 0,
  isDeleted: false,
};

describe('Store Repository Unit Test', () => {
  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    storeRepository = new StoreRepository(mockPrisma as unknown as PrismaClient);

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

    const inputData = {
      ...storeData,
      user: { connect: { id: userId } },
    };

    mockPrisma.store.create.mockResolvedValue(expectedStore);

    const result = await storeRepository.createStore(inputData);
    expect(result).toEqual(expectedStore);
    expect(mockPrisma.store.create).toHaveBeenCalledWith({
      data: inputData,
    });
    expect(mockPrisma.store.create).toHaveBeenCalledTimes(1);
  });

  test('findByName - should return a store by name', async () => {
    const storeName = 'Test Store';

    mockPrisma.store.findUnique.mockResolvedValue(expectedStore);

    const result = await storeRepository.findByName(storeName);
    expect(result).toEqual(expectedStore);
    expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
      where: { name: storeName },
    });
    expect(mockPrisma.store.findUnique).toHaveBeenCalledTimes(1);
  });

  test('findById - should return a store by ID', async () => {
    mockPrisma.store.findUnique.mockResolvedValue(expectedStore);
    const result = await storeRepository.findById(storeId);
    expect(result).toEqual(expectedStore);
    expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
      where: { id: storeId, isDeleted: false },
    });
    expect(mockPrisma.store.findUnique).toHaveBeenCalledTimes(1);
  });

  test('findMyStore - should return my store by user ID', async () => {
    mockPrisma.store.findUnique.mockResolvedValue(expectedStore);

    const result = await storeRepository.findMyStore(userId);
    expect(result).toEqual(expectedStore);
    expect(mockPrisma.store.findUnique).toHaveBeenCalledWith({
      where: { userId },
    });
    expect(mockPrisma.store.findUnique).toHaveBeenCalledTimes(1);
  });

  test('updateStore - should update a store', async () => {
    const updateData = {
      name: 'Updated Store',
      content: 'Updated content',
    };

    const updatedStore = {
      ...expectedStore,
      ...updateData,
      updatedAt: new Date(),
    };

    mockPrisma.store.update.mockResolvedValue(updatedStore);

    const result = await storeRepository.updateStore(storeId, userId, updateData);
    expect(result).toEqual(updatedStore);
    expect(mockPrisma.store.update).toHaveBeenCalledWith({
      where: { id: storeId, userId, isDeleted: false },
      data: updateData,
    });
    expect(mockPrisma.store.update).toHaveBeenCalledTimes(1);
    expect(result.name).toBe('Updated Store');
    expect(result.content).toBe('Updated content');
  });

  test('findMyStoreProducts - should return products of my store with pagination', async () => {
    const page = 1;
    const pageSize = 10;

    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Product ${i + 1}`,
      content: `Description for product ${i + 1}`,
      price: new Decimal(1000 + i * 100),
      image: `http://example.com/product${i + 1}.jpg`,
      createdAt: new Date(),
      updatedAt: new Date(),
      storeId: 's1',
      Stock: [{ quantity: 10 }],
    }));
    mockPrisma.product.findMany.mockResolvedValue(products);
    const result = await storeRepository.findMyStoreProducts(userId, page, pageSize);
    expect(result).toEqual(products);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
      where: {
        store: {
          userId,
        },
      },
      include: {
        Stock: {
          select: {
            quantity: true,
          },
        },
      },
      skip: 0,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    });
    expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  test('findMyStoreProducts - should calculate skip correctly for page 2', async () => {
    const page = 2;
    const pageSize = 10;
    const skip = (page - 1) * pageSize;
    mockPrisma.product.findMany.mockResolvedValue([]);

    await storeRepository.findMyStoreProducts(userId, page, pageSize);
    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          store: {
            userId,
          },
        },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      })
    );
    expect(mockPrisma.product.findMany).toHaveBeenCalledTimes(1);
  });

  test('countMyStoreProducts - should return the count of products in my store', async () => {
    const productCount = 25;

    mockPrisma.product.count.mockResolvedValue(productCount);

    const result = await storeRepository.countMyStoreProducts(userId);
    expect(result).toBe(productCount);
    expect(mockPrisma.product.count).toHaveBeenCalledWith({
      where: {
        store: {
          userId,
        },
      },
    });
    expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
  });

  test('calculateStock - should return total stock quantity for a product', async () => {
    const productId = 'p1';
    const totalStock = 50;

    mockPrisma.stock.aggregate.mockResolvedValue({ _sum: { quantity: totalStock } });

    const result = await storeRepository.calculateStock(productId);
    expect(result).toBe(totalStock);
    expect(mockPrisma.stock.aggregate).toHaveBeenCalledWith({
      where: { productId },
      _sum: { quantity: true },
    });
    expect(mockPrisma.stock.aggregate).toHaveBeenCalledTimes(1);
  });

  test('storeLikeCheck - should check if a user has liked a store', async () => {
    const storeLike = {
      id: 'sL1',
      userId,
      storeId,
      createdAt: new Date(),
    };

    mockPrisma.storeLike.findFirst.mockResolvedValue(storeLike);

    const result = await storeRepository.storeLikeCheck(userId, storeId);
    expect(result).toEqual(storeLike);
    expect(mockPrisma.storeLike.findFirst).toHaveBeenCalledWith({
      where: { userId, storeId },
    });
    expect(mockPrisma.storeLike.findFirst).toHaveBeenCalledTimes(1);
  });

  test('storeLikeCheck - should return null if user has not liked the store', async () => {
    mockPrisma.storeLike.findFirst.mockResolvedValue(null);

    const result = await storeRepository.storeLikeCheck(userId, storeId);
    expect(result).toBeNull();
    expect(mockPrisma.storeLike.findFirst).toHaveBeenCalledWith({
      where: { userId, storeId },
    });
    expect(mockPrisma.storeLike.findFirst).toHaveBeenCalledTimes(1);
  });

  test('createStoreLike - should create a store like', async () => {
    const storeLike = {
      id: 'sL1',
      userId,
      storeId,
      createdAt: new Date(),
      store: expectedStore,
    };

    mockPrisma.storeLike.create.mockResolvedValue(storeLike);

    const result = await storeRepository.createStoreLike(userId, storeId);
    expect(result).toEqual(storeLike);
    expect(mockPrisma.storeLike.create).toHaveBeenCalledWith({
      data: { userId, storeId },
      include: { store: true },
    });
    expect(mockPrisma.storeLike.create).toHaveBeenCalledTimes(1);
  });

  test('deleteStoreLike - should delete a store like', async () => {
    const storeLike = {
      id: 'sL1',
      userId,
      storeId,
      createdAt: new Date(),
      store: expectedStore,
    };

    mockPrisma.storeLike.delete.mockResolvedValue(storeLike);

    const result = await storeRepository.deleteStoreLike(userId, storeId);
    expect(result).toEqual(storeLike);
    expect(mockPrisma.storeLike.delete).toHaveBeenCalledWith({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
      include: { store: true },
    });
    expect(mockPrisma.storeLike.delete).toHaveBeenCalledTimes(1);
  });

  test('increaseLikeCount - should increase the favorite and monthFavoriteCount of a store', async () => {
    const updatedStore = {
      ...expectedStore,
      favoriteCount: (expectedStore.favoriteCount || 0) + 1,
      monthFavoriteCount: (expectedStore.monthFavoriteCount || 0) + 1,
    };
    mockPrisma.store.update.mockResolvedValue(updatedStore);
    const result = await storeRepository.increaseLikeCount(storeId);
    expect(result).toEqual(updatedStore);
    expect(mockPrisma.store.update).toHaveBeenCalledWith({
      where: { id: storeId },
      data: {
        favoriteCount: { increment: 1 },
        monthFavoriteCount: { increment: 1 },
      },
    });
    expect(mockPrisma.store.update).toHaveBeenCalledTimes(1);
  });

  test('decreaseLikeCount - should decrease the favoriteCount and monthFavoriteCount of a store', async () => {
    const storeAfterDecrease = {
      favoriteCount: 4,
      monthFavoriteCount: 3,
    };

    mockPrisma.store.update.mockResolvedValue(storeAfterDecrease);

    const result = await storeRepository.decreaseLikeCount(storeId);

    expect(mockPrisma.store.update).toHaveBeenCalledWith({
      where: { id: storeId },
      data: {
        favoriteCount: { decrement: 1 },
        monthFavoriteCount: { decrement: 1 },
      },
    });

    expect(result).toEqual(storeAfterDecrease);
    expect(mockPrisma.store.update).toHaveBeenCalledTimes(1);
  });

  test('updateProductCount - should update the product count of a store', async () => {
    const mockProductCount = 15;
    mockPrisma.product.count.mockResolvedValue(mockProductCount);

    const storeAfterCountUpdate = {
      ...expectedStore,
      productCount: mockProductCount,
    };
    mockPrisma.store.update.mockResolvedValue(storeAfterCountUpdate);

    const result = await storeRepository.updateProductCount(storeId);
    expect(mockPrisma.product.count).toHaveBeenCalledWith({
      where: { storeId: storeId },
    });

    expect(mockPrisma.store.update).toHaveBeenCalledWith({
      where: { id: storeId },
      data: {
        productCount: mockProductCount,
      },
    });

    expect(result).toEqual(storeAfterCountUpdate);
    expect(mockPrisma.product.count).toHaveBeenCalledTimes(1);
    expect(mockPrisma.store.update).toHaveBeenCalledTimes(1);
  });
});
