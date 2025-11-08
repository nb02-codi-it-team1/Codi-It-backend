import { BadRequestError } from '../common/errors/error-type';
import CartRepository from './cart.repository';
import { Prisma } from '@prisma/client';
import { CartDto } from './dtos/cart.dto';
import { CartResponseDto } from './dtos/cart-response.dto';
import { CartItemDto } from './dtos/cart-item.dto';
import { CartItemDetailDto } from './dtos/cart-item-detail.dto';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartBySizesDto } from './dtos/update-cart-by-sizes.dto';

export default class CartService {
  constructor(private readonly repository: CartRepository) {}

  // --- CREATE (POST /api/cart) ---
  async createCartItem(buyerId: string, dto: CreateCartItemDto): Promise<CartDto> {
    const cart = await this.repository.getOrCreateCartByBuyer(buyerId);
    const existing = await this.repository.findCartItem(cart.id, dto.productId, dto.sizeId);

    if (existing) {
      await this.repository.updateCartItem(existing.id, existing.quantity + dto.quantity);
    } else {
      const createData: Prisma.CartItemCreateInput = {
        cart: { connect: { id: cart.id } },
        product: { connect: { id: dto.productId } },
        size: { connect: { id: dto.sizeId } },
        quantity: dto.quantity,
      };
      await this.repository.createCartItem(createData);
    }

    await this.repository.recalcCartQuantity(cart.id);

    const updatedCart = await this.repository.getOrCreateCartByBuyer(buyerId);

    return {
      id: updatedCart.id,
      buyerId: updatedCart.buyerId,
      quantity: updatedCart.quantity,
      createdAt: updatedCart.createdAt.toISOString(),
      updatedAt: updatedCart.updatedAt.toISOString(),
    } as CartDto;
  }

  // --- READ ALL (GET /api/cart) ---
  async getCartItems(buyerId: string): Promise<CartResponseDto> {
    const cart = await this.repository.getOrCreateCartByBuyer(buyerId);
    const rows = await this.repository.findAllCartItems(cart.id);

    const items = rows.map((it) => this.repository.toCartItemDto(it));

    return {
      id: cart.id,
      buyerId: cart.buyerId,
      quantity: cart.quantity,
      createdAt: cart.createdAt.toISOString(),
      updatedAt: cart.updatedAt.toISOString(),
      items,
    } as CartResponseDto;
  }

  // --- UPDATE (PATCH /api/cart) ---
  async patchCartItems(buyerId: string, dto: UpdateCartBySizesDto): Promise<CartItemDto[]> {
    if (!dto.productId || !Array.isArray(dto.sizes)) {
      throw new BadRequestError();
    }

    const cart = await this.repository.getOrCreateCartByBuyer(buyerId);

    for (const { sizeId, quantity } of dto.sizes) {
      const existing = await this.repository.findCartItem(cart.id, dto.productId, sizeId);

      if (!existing && quantity > 0) {
        const createData: Prisma.CartItemCreateInput = {
          cart: { connect: { id: cart.id } },
          product: { connect: { id: dto.productId } },
          size: { connect: { id: sizeId } },
          quantity: quantity,
        };
        await this.repository.createCartItem(createData);
      } else if (existing && quantity > 0) {
        await this.repository.updateCartItem(existing.id, quantity);
      } else if (existing && quantity === 0) {
        await this.repository.deleteCartItem(existing.id);
      }
    }

    await this.repository.recalcCartQuantity(cart.id);

    const updatedRows = await this.repository.findAllCartItems(cart.id);
    return updatedRows.map((it) => this.repository.toCartItemDto(it));
  }

  // --- READ ONE (GET /api/cart/:cartItemId) ---
  async getCartItem(buyerId: string, cartItemId: string): Promise<CartItemDetailDto> {
    const item = await this.repository.findCartItemDetail(cartItemId, buyerId);

    const cartItemDto = this.repository.toCartItemDto(item);

    const cartDto: CartDto = {
      id: item.cart.id,
      buyerId: item.cart.buyerId,
      quantity: item.cart.quantity,
      createdAt: item.cart.createdAt.toISOString(),
      updatedAt: item.cart.updatedAt.toISOString(),
    };

    return { ...cartItemDto, cart: cartDto } as CartItemDetailDto;
  }

  // --- DELETE (DELETE /api/cart/:cartItemId) ---
  async removeCartItem(buyerId: string, cartItemId: string): Promise<void> {
    const item = await this.repository.findCartItemDetail(cartItemId, buyerId);

    await this.repository.deleteCartItem(item.id);
    await this.repository.recalcCartQuantity(item.cartId);
  }
}
