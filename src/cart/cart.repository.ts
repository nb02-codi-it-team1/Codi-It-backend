// ./src/cart/cart.repository.ts

import { PrismaClient, Prisma } from '@prisma/client';
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
                    size: { select: { id: true, name: true, ko: true, en: true } } 
                } 
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
        const store = p.store;

        return {
            id: it.id,
            cartId: it.cartId,
            productId: it.productId,
            sizeId: it.sizeId,
            quantity: it.quantity,
            createdAt: it.createdAt.toISOString(),
            updatedAt: it.updatedAt.toISOString(),
            product: {
                id: p.id,
                storeId: p.storeId,
                name: p.name,
                price: Number(p.price),
                image: p.image,
                discountRate: p.discountRate ?? 0,
                discountStartTime: p.discountStartTime ? p.discountStartTime.toISOString() : null,
                discountEndTime: p.discountEndTime ? p.discountEndTime.toISOString() : null,
                createdAt: p.createdAt.toISOString(),
                updatedAt: p.updatedAt.toISOString(),
                store: {
                    id: store.id,
                    userId: store.userId,
                    name: store.name,
                    address: store.address,
                    phoneNumber: store.phoneNumber,
                    content: store.content,
                    image: store.image ?? '',
                    createdAt: store.createdAt.toISOString(),
                    updatedAt: store.updatedAt.toISOString(),
                },
                stocks: p.Stock.map((st) => ({
                    id: st.id,
                    productId: st.productId,
                    sizeId: st.sizeId,
                    quantity: st.quantity,
                    size: {
                        id: st.size.id,
                        size: {
                            en: st.size.en,
                            ko: st.size.ko,
                        },
                    },
                })),
            },
        };
    }

    public async getOrCreateCartByBuyer(buyerId: string): Promise<Prisma.CartGetPayload<{}>> {
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

    public async findCartItemDetail(cartItemId: string, buyerId: string): Promise<CartItemPrismaPayload> {
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