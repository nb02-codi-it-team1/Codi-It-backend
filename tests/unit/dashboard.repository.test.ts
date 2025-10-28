// dashboard.repository unit test

import { PrismaClient } from '@prisma/client/extension';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import DashboardRepository from 'src/dashboard/dashboard.repository';

let mockPrisma: DeepMockProxy<PrismaClient>;
let dashboardRepository: DashboardRepository;

const storeId = 's1';
const startDate = new Date('2025-10-01');
const endDate = new Date('2025-10-05');

describe('Dashboard Repository Unit Test', () => {
  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    dashboardRepository = new DashboardRepository(mockPrisma as unknown as PrismaClient);

    jest.clearAllMocks();
  });

  test('getSalesAndOrdersByPeriod - should return total sales and orders for the period', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([
      { orderId: 'order1' },
      { orderId: 'order2' },
      { orderId: 'order3' },
    ]);
    const mockDecimal = { toString: () => '12345.00' };
    mockPrisma.orderItem.aggregate.mockResolvedValue({
      _sum: {
        quantity: 5,
        price: mockDecimal,
      },
      _count: { orderId: 3 },
    });

    const result = await dashboardRepository.getSalesAndOrdersByPeriod(storeId, startDate, endDate);

    expect(result.totalOrders).toBe(3);
    expect(result.totalSales).toBe(12345);

    expect(mockPrisma.payment.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.orderItem.aggregate).toHaveBeenCalledTimes(1);
  });

  test('getSalesAndOrdersByPeriod - should return zero if no payments found', async () => {
    mockPrisma.payment.findMany.mockResolvedValue([]);

    const result = await dashboardRepository.getSalesAndOrdersByPeriod(storeId, startDate, endDate);

    expect(result.totalOrders).toBe(0);
    expect(result.totalSales).toBe(0);

    expect(mockPrisma.payment.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrisma.orderItem.aggregate).not.toHaveBeenCalled();
  });

  test('getTopSellingProducts - should return top selling products', async () => {
    mockPrisma.orderItem.groupBy.mockResolvedValue([
      { productId: 'prodA', _sum: { quantity: 20 } },
      { productId: 'prodB', _sum: { quantity: 15 } },
    ]);

    const mockProducts = [
      { id: 'prodA', name: 'Product A', price: { toString: () => '50000' } },
      { id: 'prodB', name: 'Product B', price: { toString: () => '20000' } },
    ];
    mockPrisma.product.findMany.mockResolvedValue(mockProducts);

    const result = await dashboardRepository.getTopSellingProducts(storeId, 5);

    expect(result).toHaveLength(2);
    expect(result[0]?.products.name).toBe('Product A');
    expect(result[0]?.totalOrders).toBe(20);
    expect(result[0]?.products.price).toBe(50000);

    expect(result[1]?.products.name).toBe('Product B');
    expect(result[1]?.totalOrders).toBe(15);
  });

  test('getTopSellingProducts - should return empty array if no top items found', async () => {
    mockPrisma.orderItem.groupBy.mockResolvedValue([]);

    const result = await dashboardRepository.getTopSellingProducts(storeId);

    expect(result).toEqual([]);
    expect(mockPrisma.product.findMany).not.toHaveBeenCalled();
  });

  test('getSalesByPriceRange - should return sales aggregated by price range with percentage', async () => {
    const mockRawResult = [
      { priceRange: '10만원 이상 ', totalSales: 120000 },
      { priceRange: '5만원~10만원', totalSales: 75000 },
      { priceRange: '3만원~5만원', totalSales: 35000 },
      { priceRange: '1만원~3만원', totalSales: 15000 },
      { priceRange: '1만원 이하', totalSales: 5000 },
    ];

    mockPrisma.$queryRaw.mockResolvedValue(mockRawResult);

    const result = await dashboardRepository.getSalesByPriceRange(storeId);

    expect(result).toHaveLength(5);

    expect(result[4]?.priceRange).toBe('1만원 이하');
    expect(result[4]?.percentage).toBe(2);
    expect(result[0]?.percentage).toBe(48);
    expect(result[1]?.priceRange).toBe('5만원~10만원');
    expect(result[0]?.totalSales).toBe(120000);
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
  });

  test('getSalesByPriceRange - should return empty array if raw query returns no data', async () => {
    mockPrisma.$queryRaw.mockResolvedValue([]);

    const result = await dashboardRepository.getSalesByPriceRange(storeId);

    expect(result).toEqual([]);
  });
});
