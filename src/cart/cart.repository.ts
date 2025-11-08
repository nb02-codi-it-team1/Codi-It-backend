import { PrismaClient, Prisma, Cart } from '@prisma/client';
import { NotFoundError } from '../common/errors/error-type';
import { CartItemDto } from './dtos/cart-item.dto';

// CartItem 쿼리에서 사용되는 공통 include 옵션
const cartItemIncludeOptions = Prisma.validator<Prisma.CartItemInclude>()({
  cart: true,
  size: { select: { id: true, name: true, ko: true, en: true } },
  product: {
    include: {
      store: true,
      Stock: {
        include: {
          size: { select: { id: true, name: true, ko: true, en: true } },
        },
      },
    },
  },
});

type CartItemPrismaPayload = Prisma.CartItemGetPayload<{
  include: typeof cartItemIncludeOptions;
}>;

export default class CartRepository {
  constructor(private readonly prisma: PrismaClient) {}

  public toCartItemDto(it: CartItemPrismaPayload): CartItemDto {
    const p = it.product;
    if (!p || !p.store) {
      // Product, Store, Stock 중 하나라도 누락되면 유효하지 않은 데이터로 간주
      throw new NotFoundError('장바구니 아이템에 연결된 상품 정보를 찾을 수 없습니다.');
    }
    const store = p.store;

    return {
      // CartItemDto 기본 필드
      id: it.id,
      cartId: it.cartId,
      productId: it.productId,
      sizeId: it.sizeId,
      quantity: it.quantity,
      createdAt: it.createdAt.toISOString(),
      updatedAt: it.updatedAt.toISOString(),

      // ProductInCartDto 필드 매핑
      product: {
        id: p.id,
        storeId: p.storeId,
        name: p.name,
        // price는 최종 정수 값으로 변환
        price: Number(p.price),
        image: p.image,
        discountRate: p.discountRate, // Null 값 처리는 필요하다면 추가
        discountStartTime: p.discountStartTime ? p.discountStartTime.toISOString() : null,
        discountEndTime: p.discountEndTime ? p.discountEndTime.toISOString() : null,
        storeName: p.store.name,
        isSoldOut: p.isSoldOut, // isSoldOut 필드가 product에 있다고 가정

        // StoreInCartDto 필드 매핑
        store: {
          id: store.id,
          name: store.name,
        },

        // StockInCartDto[] 필드 매핑
        stocks: p.Stock.map((st) => ({
          id: st.id,
          quantity: st.quantity,
          size: {
            id: st.sizeId,
            name: st.size.ko,
          },
        })),
      },
    };
  }

  public async getOrCreateCartByBuyer(buyerId: string): Promise<Cart> {
    const found = await this.prisma.cart.findUnique({ where: { buyerId } });
    if (found) return found;
    return this.prisma.cart.create({ data: { buyerId, quantity: 0 } });
  }

  public async recalcCartQuantity(cartId: string): Promise<void> {
    const items = await this.prisma.cartItem.findMany({ where: { cartId } });
    const total = items.reduce((sum, i) => sum + i.quantity, 0);
    await this.prisma.cart.update({ where: { id: cartId }, data: { quantity: total } });
  }

  public async findCartItem(cartId: string, productId: string, sizeId: number) {
    return this.prisma.cartItem.findFirst({ where: { cartId, productId, sizeId } });
  }

  public async createCartItem(data: Prisma.CartItemCreateInput) {
    return this.prisma.cartItem.create({ data });
  }

  public async updateCartItem(id: string, quantity: number) {
    return this.prisma.cartItem.update({ where: { id }, data: { quantity } });
  }

  public async findCartItemDetail(
    cartItemId: string,
    buyerId: string
  ): Promise<CartItemPrismaPayload> {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: cartItemId, cart: { buyerId } },
      include: cartItemIncludeOptions,
    });
    if (!item) throw new NotFoundError();
    return item;
  }

  public async findAllCartItems(cartId: string): Promise<CartItemPrismaPayload[]> {
    return this.prisma.cartItem.findMany({
      where: { cartId },
      include: cartItemIncludeOptions,
      orderBy: { createdAt: 'asc' },
    });
  }

  public async deleteCartItem(id: string): Promise<void> {
    await this.prisma.cartItem.delete({ where: { id } });
  }
}
