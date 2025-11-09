import { Prisma, PrismaClient, PaymentStatus } from '@prisma/client';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';

const prisma = new PrismaClient();
const D = Prisma.Decimal;

export type FrontReview = {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
};

export type FrontProduct = {
  name: string;
  image?: string;
  reviews: FrontReview[];
};

export type FrontOrderItem = {
  id: string;
  price: number;
  quantity: number;
  isReviewed: boolean;
  productId: string;
  product: FrontProduct;
  size: { size: { en: string; ko: string } };
};

export type FrontPayment = {
  id: string;
  price: number;
  status: PaymentStatus;
  createdAt: string;
};

export type FrontOrder = {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  subtotal: number;
  totalQuantity: number;
  usePoint: number;
  createdAt: string;
  orderItems: FrontOrderItem[];
  payments: FrontPayment | null;
};

export type FrontOrderListResponse = {
  data: FrontOrder[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

type CreateOrderFromCartInput = {
  name: string;
  phoneNumber: string;
  address: string;
  usePoint: number;
};

const orderWithItemsInclude = Prisma.validator<Prisma.OrderInclude>()({
  payment: true,
  OrderItem: {
    include: {
      product: {
        select: {
          name: true,
          image: true,
          Review: {
            select: { id: true, rating: true, content: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
          },
        },
      },
    },
  },
});
type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderWithItemsInclude }>;

function toNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v);
  return Number((v as { toString(): string }).toString());
}

function mapOrderToFront(
  order: OrderWithItems,
  sizeMap: Map<number, { en: string; ko: string }>
): FrontOrder {
  return {
    id: order.id,
    name: order.name,
    address: order.address,
    phoneNumber: order.phoneNumber,
    subtotal: toNumber(order.subtotal),
    totalQuantity: order.totalQuantity,
    usePoint: order.usePoint,
    createdAt: order.createdAt.toISOString(),
    orderItems: order.OrderItem.map((it) => {
      const sizeInfo = sizeMap.get(it.sizeId) ?? { en: '', ko: '' };
      const en = sizeInfo.en || sizeInfo.ko;
      return {
        id: it.id,
        price: toNumber(it.price),
        quantity: it.quantity,
        isReviewed: Boolean(it.isReviewed),
        productId: it.productId,
        product: {
          name: it.product?.name ?? '',
          image: it.product?.image ?? undefined,
          reviews: (it.product?.Review ?? []).map((r) => ({
            id: r.id,
            rating: r.rating,
            content: r.content,
            createdAt: r.createdAt.toISOString(),
          })),
        },
        size: { size: { en, ko: en } },
      };
    }),
    payments: order.payment
      ? {
          id: order.payment.id,
          price: toNumber(order.payment.price),
          status: order.payment.status,
          createdAt: order.payment.createdAt.toISOString(),
        }
      : null,
  };
}

function isDiscountActive(
  rate: number | null,
  start: Date | null,
  end: Date | null,
  now: Date
): boolean {
  if (rate == null || rate <= 0) return false;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

export class OrderRepository {
  /**
   * 주문 생성 트랜잭션
   */
  async createOrderTransaction(userId: string, dto: CreateOrderDto): Promise<FrontOrder> {
    if (!dto.orderItems || dto.orderItems.length === 0) {
      throw new Error('orderItems가 비어 있습니다.');
    }
    const items = dto.orderItems;

    return prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1) 가격/재고 조회(할인 정보 포함)
      const productIds = items.map((i) => i.productId);
      const stocksToCheck = items.map((i) => ({ productId: i.productId, sizeId: i.sizeId }));

      const [products, stocks] = await Promise.all([
        tx.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            price: true,
            discountRate: true,
            discountStartTime: true,
            discountEndTime: true,
          },
        }),
        tx.stock.findMany({
          where: { OR: stocksToCheck.map((s) => ({ productId: s.productId, sizeId: s.sizeId })) },
          select: { id: true, productId: true, sizeId: true, quantity: true },
        }),
      ]);

      const productUnitMap = new Map<string, Prisma.Decimal>(
        products.map((p) => {
          const active = isDiscountActive(
            p.discountRate,
            p.discountStartTime,
            p.discountEndTime,
            now
          );
          const unit = active
            ? new D(p.price).mul(new D(100 - (p.discountRate ?? 0))).div(100)
            : new D(p.price);
          return [p.id, unit];
        })
      );

      const stockMap = new Map<string, { id: string; quantity: number }>();
      stocks.forEach((s) =>
        stockMap.set(`${s.productId}::${s.sizeId}`, { id: s.id, quantity: s.quantity })
      );

      // 2) 재고 검증 + 합계(Decimal) 계산
      let subtotal = new D(0);
      let totalQuantity = 0;

      for (const it of items) {
        const unit = productUnitMap.get(it.productId);
        if (!unit) throw new Error(`상품 가격을 찾을 수 없습니다. productId=${it.productId}`);

        const key = `${it.productId}::${it.sizeId}`;
        const stockRow = stockMap.get(key);
        if (!stockRow)
          throw new Error(
            `해당 옵션의 재고가 없습니다. productId=${it.productId}, sizeId=${it.sizeId}`
          );
        if (stockRow.quantity < it.quantity) {
          throw new Error(
            `재고 부족: productId=${it.productId}, sizeId=${it.sizeId}, 요청=${it.quantity}, 보유=${stockRow.quantity}`
          );
        }

        subtotal = subtotal.add(unit.mul(it.quantity));
        totalQuantity += it.quantity;
      }

      // 3) 포인트 정책: 전액 포인트 결제만 허용
      const usePoint = Math.max(0, dto.usePoint ?? 0);
      const usePointDec = new D(usePoint);

      if (usePointDec.gt(subtotal)) {
        throw new Error('사용 포인트가 결제금액보다 클 수 없습니다.');
      }

      const remaining = subtotal.sub(usePointDec);
      if (!remaining.isZero()) {
        throw new Error('잔액이 남아 결제할 수 없습니다. 포인트로 전액 결제만 가능합니다.');
      }

      // 포인트 잔액 검증 및 차감
      if (usePoint > 0) {
        const me = await tx.user.findUnique({ where: { id: userId }, select: { points: true } });
        if (!me) throw new Error('사용자를 찾을 수 없습니다.');
        if (me.points < usePoint) throw new Error('포인트 잔액이 부족합니다.');
        await tx.user.update({
          where: { id: userId },
          data: { points: { decrement: usePoint } },
        });
      }

      // 4) 주문 생성
      const created = await tx.order.create({
        data: {
          buyerId: userId,
          name: dto.name,
          phoneNumber: dto.phoneNumber,
          address: dto.address,
          subtotal, // Decimal(18,2)
          totalQuantity,
          usePoint,
        },
      });

      // 5) 주문 아이템 생성(단가 = 할인 반영가)
      await tx.orderItem.createMany({
        data: items.map((it) => ({
          orderId: created.id,
          productId: it.productId,
          sizeId: it.sizeId,
          quantity: it.quantity,
          price: productUnitMap.get(it.productId)!, // Decimal
        })),
      });

      // 6) 재고 차감(동시성 안전)
      for (const it of items) {
        const updated = await tx.stock.updateMany({
          where: { productId: it.productId, sizeId: it.sizeId, quantity: { gte: it.quantity } },
          data: { quantity: { decrement: it.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(`재고 차감 실패(동시성): productId=${it.productId}, sizeId=${it.sizeId}`);
        }
      }

      // 7) 품절 처리
      const uniqueProductIds = Array.from(new Set(items.map((i) => i.productId)));
      const left = await tx.stock.groupBy({
        by: ['productId'],
        where: { productId: { in: uniqueProductIds } },
        _sum: { quantity: true },
      });
      const soldOutIds = left.filter((g) => (g._sum.quantity ?? 0) <= 0).map((g) => g.productId);
      if (soldOutIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: soldOutIds } },
          data: { isSoldOut: true },
        });
      }

      // 8) 가상 결제(전액 포인트 → 0원)
      await tx.payment.create({
        data: { orderId: created.id, price: new D(0), status: PaymentStatus.CompletedPayment },
      });

      // 9) 응답 매핑(사이즈 라벨 EN 강제)
      const full = await tx.order.findUnique({
        where: { id: created.id },
        include: orderWithItemsInclude,
      });
      if (!full) throw new Error('생성된 주문을 조회할 수 없습니다.');

      const sizeIds = Array.from(new Set(full.OrderItem.map((i) => i.sizeId)));
      const sizes = await tx.size.findMany({
        where: { id: { in: sizeIds } },
        select: { id: true, en: true, ko: true },
      });
      const sizeMap = new Map(sizes.map((s) => [s.id, { en: s.en, ko: s.ko }]));

      return mapOrderToFront(full, sizeMap);
    });
  }

  /** 장바구니에서 주문 생성 */
  async createOrderFromCart(userId: string, dto: CreateOrderFromCartInput): Promise<FrontOrder> {
    const cart = await prisma.cart.findUnique({
      where: { buyerId: userId },
      include: { items: true },
    });
    if (!cart || cart.items.length === 0) {
      throw new Error('장바구니가 비어 있습니다.');
    }

    const orderItems = cart.items.map((ci) => ({
      productId: ci.productId,
      sizeId: ci.sizeId,
      quantity: ci.quantity,
    }));

    const fullDto: CreateOrderDto = {
      name: dto.name,
      phoneNumber: dto.phoneNumber,
      address: dto.address,
      usePoint: dto.usePoint,
      orderItems,
    };

    const created = await this.createOrderTransaction(userId, fullDto);

    // 주문 성공 후 장바구니 비우기(선택)
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  }

  /** 내 주문 목록 */
  async findOrdersByBuyer(
    userId: string,
    skip: number,
    take: number
  ): Promise<FrontOrderListResponse> {
    const [rows, total] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: userId },
        include: orderWithItemsInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where: { buyerId: userId } }),
    ]);

    const sizeIds = Array.from(new Set(rows.flatMap((o) => o.OrderItem.map((i) => i.sizeId))));
    const sizes = await prisma.size.findMany({
      where: { id: { in: sizeIds } },
      select: { id: true, en: true, ko: true },
    });
    const sizeMap = new Map(sizes.map((s) => [s.id, { en: s.en, ko: s.ko }]));

    return {
      data: rows.map((o) => mapOrderToFront(o, sizeMap)),
      meta: {
        total,
        page: Math.floor(skip / take) + 1,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /** 주문 상세 */
  async findOrderDetail(userId: string, orderId: string): Promise<FrontOrder | null> {
    const row = await prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: orderWithItemsInclude,
    });
    if (!row) return null;

    const sizeIds = Array.from(new Set(row.OrderItem.map((i) => i.sizeId)));
    const sizes = await prisma.size.findMany({
      where: { id: { in: sizeIds } },
      select: { id: true, en: true, ko: true },
    });
    const sizeMap = new Map(sizes.map((s) => [s.id, { en: s.en, ko: s.ko }]));

    return mapOrderToFront(row, sizeMap);
  }

  /** 주문 정보 수정 */
  async updateOrder(userId: string, orderId: string, dto: UpdateOrderDto): Promise<FrontOrder> {
    const own = await prisma.order.findFirst({ where: { id: orderId, buyerId: userId } });
    if (!own) throw new Error('주문을 찾을 수 없거나 접근 권한이 없습니다.');

    await prisma.order.update({
      where: { id: orderId },
      data: {
        name: dto.name ?? undefined,
        phoneNumber: dto.phoneNumber ?? undefined,
        address: dto.address ?? undefined,
      },
    });

    const updated = await this.findOrderDetail(userId, orderId);
    if (!updated) throw new Error('주문을 다시 조회할 수 없습니다.');
    return updated;
  }

  /** 주문 삭제 */
  async deleteOrder(userId: string, orderId: string): Promise<void> {
    const own = await prisma.order.findFirst({ where: { id: orderId, buyerId: userId } });
    if (!own) throw new Error('주문을 찾을 수 없거나 접근 권한이 없습니다.');
    await prisma.order.delete({ where: { id: orderId } });
  }
}
