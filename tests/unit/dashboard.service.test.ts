import { MockProxy, mock } from 'jest-mock-extended';
import DashboardRepository from 'src/dashboard/dashboard.repository';
import DashboardService from 'src/dashboard/dashboard.service';

jest.mock('../../src/dashboard/dashboard.repository');

jest.mock('../../src/common/utils/date-util', () => ({
  // 1. 'today'
  getStartOfToday: jest.fn(() => new Date('2025-10-27T00:00:00.000Z')),
  getStartOfNextDay: jest.fn(() => new Date('2025-10-28T00:00:00.000Z')),

  // 2. 'week'
  getStartOfWeek: jest.fn(() => new Date('2025-10-20T00:00:00.000Z')),
  getStartOfNextWeek: jest.fn(() => new Date('2025-10-27T00:00:00.000Z')),

  // 3. 'month'
  getStartOfMonth: jest.fn(() => new Date('2025-10-01T00:00:00.000Z')),
  getStartOfNextMonth: jest.fn(() => new Date('2025-11-01T00:00:00.000Z')),

  // 4. 'year'
  getStartOfYear: jest.fn(() => new Date('2025-01-01T00:00:00.000Z')),
  getStartOfNextYear: jest.fn(() => new Date('2026-01-01T00:00:00.000Z')),

  getStartOfPreviousPeriod: jest.fn((date) => {
    // 이 함수는 duration 매개변수를 받지만, 간단히 Mocking하여 예측 가능한 값 반환
    if (date.toISOString().startsWith('2025-10-27')) return new Date('2025-10-26T00:00:00.000Z');
    if (date.toISOString().startsWith('2025-10-20')) return new Date('2025-10-13T00:00:00.000Z');
    return new Date('2024-01-01T00:00:00.000Z');
  }),
}));

jest.mock('../../src/common/utils/stats-util', () => ({
  calculateChangeRate: jest.fn((current, previous) => {
    // Mocking된 함수가 계산 대신 고정된 값을 반환하도록 설정
    if (current === 200 && previous === 100) return 100; // 매출 100% 증가
    if (current === 50 && previous === 100) return -50; // 주문 50% 감소
    return 0;
  }),
}));

const storeId = 's1';

describe('Dashboard-Service Unit Test', () => {
  let dashboardRepository: MockProxy<DashboardRepository>;
  let dashboardService: DashboardService;

  beforeEach(() => {
    dashboardRepository = mock<DashboardRepository>();
    dashboardService = new DashboardService(dashboardRepository);

    jest.clearAllMocks();
  });

  test('getPeriodSummary - should correctly calculate periods and change rates', async () => {
    const currentStats = { totalSales: 200, totalOrders: 50 };
    const previousStats = { totalSales: 100, totalOrders: 100 };

    dashboardRepository.getSalesAndOrdersByPeriod
      .mockResolvedValueOnce(currentStats)
      .mockResolvedValueOnce(previousStats);

    const summary = await dashboardService.getPeriodSummary(storeId, 'today');

    expect(dashboardRepository.getSalesAndOrdersByPeriod).toHaveBeenCalledTimes(2);
    expect(dashboardRepository.getSalesAndOrdersByPeriod).toHaveBeenCalledWith(
      storeId,
      new Date('2025-10-27T00:00:00.000Z'),
      new Date('2025-10-28T00:00:00.000Z')
    );
    expect(dashboardRepository.getSalesAndOrdersByPeriod).toHaveBeenCalledWith(
      storeId,
      new Date('2025-10-26T00:00:00.000Z'),
      new Date('2025-10-27T00:00:00.000Z')
    );

    expect(summary.current).toEqual(currentStats);
    expect(summary.previous).toEqual(previousStats);

    expect(summary.changeRate.totalSales).toBe(100);
    expect(summary.changeRate.totalOrders).toBe(-50);
  });

  test('getDashboardSummary - should call all repository methods and combine results', async () => {
    const limit = 5;

    // const mockSummary = {
    //   current: { totalSales: 1 },
    //   previous: { totalSales: 0 },
    //   changeRate: { totalSales: 100 },
    // };
    const mockTopSales = [
      {
        totalOrders: 10,
        products: {
          id: 'prod-A',
          name: 'Product A',
          price: 50000,
        },
      },
    ];
    const mockPriceRange = [
      {
        priceRange: '1만~3만',
        totalSales: 30000,
        percentage: 50,
      },
    ];

    dashboardRepository.getSalesAndOrdersByPeriod.mockResolvedValue({
      totalSales: 1,
      totalOrders: 1,
    });
    dashboardRepository.getTopSellingProducts.mockResolvedValue(mockTopSales);
    dashboardRepository.getSalesByPriceRange.mockResolvedValue(mockPriceRange);

    const result = await dashboardService.getDashboardSummary(storeId, limit);

    expect(dashboardRepository.getSalesAndOrdersByPeriod).toHaveBeenCalledTimes(8);
    expect(dashboardRepository.getTopSellingProducts).toHaveBeenCalledTimes(1);
    expect(dashboardRepository.getSalesByPriceRange).toHaveBeenCalledTimes(1);

    expect(dashboardRepository.getTopSellingProducts).toHaveBeenCalledWith(storeId, limit);
    expect(dashboardRepository.getSalesByPriceRange).toHaveBeenCalledWith(storeId);

    expect(result.today).toBeDefined();
    expect(result.week).toBeDefined();
    expect(result.month).toBeDefined();
    expect(result.year).toBeDefined();
    expect(result.topSales).toEqual(mockTopSales);
    expect(result.priceRange).toEqual(mockPriceRange);
  });
});
