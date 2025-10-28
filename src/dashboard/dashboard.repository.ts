import { Prisma } from '@prisma/client';
import { PrismaClient } from '@prisma/client/extension';
import { SalesStatsDto } from './dtos/stats.dto';
import { TopSalesItemDto } from './dtos/top-sales-item.dto';
import { PriceRangeItemDto } from './dtos/price-range-item.dto';
import { Decimal } from '@prisma/client/runtime/library';

type TopItemResult = {
  productId: string;
  _sum: {
    quantity: number | null;
  };
};

type ProductInfoResult = {
  id: string;
  name: string;
  price: Decimal;
};

export default class DashboardRepository {
  private readonly prisma: PrismaClient | Prisma.TransactionClient;

  constructor(prisma: PrismaClient | Prisma.TransactionClient) {
    this.prisma = prisma;
  }

  async getSalesAndOrdersByPeriod(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesStatsDto> {
    const completedPayments = await this.prisma.payment.findMany({
      where: {
        status: 'CompletedPayment',
        createdAt: {
          gte: startDate,
          lt: endDate,
        },

        order: {
          is: {
            OrderItem: {
              some: {
                product: {
                  storeId: storeId,
                },
              },
            },
          },
        },
      },
      select: {
        orderId: true,
      },
    });
    if (completedPayments.length === 0) {
      return { totalOrders: 0, totalSales: 0 };
    }

    const orderIds = completedPayments.map((p: { orderId: string }) => p.orderId);
    const result = await this.prisma.orderItem.aggregate({
      where: {
        orderId: { in: orderIds }, // 결제 완료된 주문 ID 목록에 포함된 항목
        product: {
          storeId: storeId, // 해당 store의 상품인지 다시 확인
        },
      },
      _sum: {
        quantity: true,
        price: true,
      },
      _count: {
        orderId: true, // 총 주문 건수 (Order의 개수)
      },
    });

    const totalOrders = completedPayments.length;
    const totalSales = Number(result._sum.price) || 0; // Decimal 타입, Number()함수를 통해 안전하게 처리

    return {
      totalOrders: totalOrders,
      totalSales: totalSales,
    };
  }

  async getTopSellingProducts(storeId: string, limit: number = 5): Promise<TopSalesItemDto[]> {
    const topItems: TopItemResult[] = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        product: {
          storeId: storeId,
        },

        order: {
          payment: {
            status: 'CompletedPayment', // 결제 완료된 주문만
          },
        },
      },
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (topItems.length === 0) return [];

    // Top 상품 목록의 상세 정보를 Product 테이블에서 가져옵니다.
    const productIds = topItems.map((item) => item.productId);
    const products: ProductInfoResult[] = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    // 데이터를 TopSalesItemDto 구조에 맞게 조립합니다.
    return topItems
      .map((item) => {
        const productInfo = products.find((p) => p.id === item.productId);

        // ProductInfo가 없는 경우를 대비해 기본값 처리
        if (!productInfo) return null;

        return {
          totalOrders: item._sum.quantity || 0,
          products: {
            id: productInfo.id,
            name: productInfo.name,
            price: Number(productInfo.price),
          },
        } as TopSalesItemDto;
      })
      .filter((item): item is TopSalesItemDto => item !== null);
  }

  async getSalesByPriceRange(storeId: string): Promise<PriceRangeItemDto[]> {
    // 상품 가격을 기준으로 매출액을 그룹화하기 위해 Raw SQL 사용 (Prisma의 $queryRaw)
    const rawResult = await this.prisma.$queryRaw<{ priceRange: string; totalSales: number }[]>`
        SELECT
            -- 상품 가격을 기준으로 카테고리 분류 (CASE WHEN)
            CASE
                WHEN p."price" <= 10000 THEN '만원 이하'
                WHEN p."price" > 10000 AND p."price" <= 30000 THEN '1만원~3만원'
                WHEN p."price" > 30000 AND p."price" <= 50000 THEN '3만원~5만원'
                WHEN p."price" > 50000 AND p."price" <= 100000 THEN '5만원~10만원'
                ELSE '10만원 이상'
            END AS "priceRange",
            
            -- 해당 가격대의 OrderItem 총 가격(매출) 합산
            SUM(oi."price") AS "totalSales"

        FROM "OrderItem" oi
        
        -- 상품 정보 (가격을 가져오기 위해)
        JOIN "Product" p ON oi."productId" = p.id
        
        -- 결제 정보 (결제 완료된 주문만 포함하기 위해)
        JOIN "Order" o ON oi."orderId" = o.id
        JOIN "Payment" pm ON o.id = pm."orderId"
        
        WHERE 
            p."storeId" = ${storeId}::text -- 현재 스토어 상품만
            AND pm.status = 'CompletedPayment'
            
        GROUP BY 1 -- priceRange 기준으로 그룹화
        ORDER BY "totalSales" DESC;
    `;

    if (rawResult.length === 0) return [];

    // 총 매출(Grand Total) 계산
    const grandTotal = rawResult.reduce(
      (sum: number, item: { priceRange: string; totalSales: number }) =>
        sum + Number(item.totalSales),
      0
    );

    // 비중 계산 및 DTO 형태로 변환
    return rawResult.map((item: { priceRange: string; totalSales: number }) => {
      const totalSales = Number(item.totalSales);
      const percentage = Number(totalSales / grandTotal) * 100;

      return {
        priceRange: item.priceRange,
        totalSales: totalSales,
        percentage: Math.round(percentage * 100) / 100, // 소수점 둘째 자리까지 반올림
      } as PriceRangeItemDto;
    });
  }
}
