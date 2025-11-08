import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import CartService from '../../src/cart/cart.service';
import CartRepository from '../../src/cart/cart.repository';
import { Prisma, Cart as PrismaCart, CartItem as PrismaCartItem } from '@prisma/client';
import { NotFoundError } from '../../src/common/errors/error-type';
import { CartDto } from '../../src/cart/dtos/cart.dto';
import { CartItemDto } from '../../src/cart/dtos/cart-item.dto';
import { CartItemDetailDto } from '../../src/cart/dtos/cart-item-detail.dto';
import { CreateCartItemDto } from '../../src/cart/dtos/create-cart-item.dto';
import { UpdateCartBySizesDto } from '../../src/cart/dtos/update-cart-by-sizes.dto';

type RepoCartItemPayload = Parameters<CartRepository['toCartItemDto']>[0];

let repo: DeepMockProxy<CartRepository>;
let service: CartService;

const BUYER_ID = 'user-test-123';
const CART_ID = 'cart-test-ABC';
const PRODUCT_ID = 'prod-A';
const SIZE_ID = 1;
const CART_ITEM_ID = 'item-XYZ';
const NOW = new Date();

/** Prisma Cart (원본은 Date) */
const cart: PrismaCart = {
  id: CART_ID,
  buyerId: BUYER_ID,
  quantity: 5,
  createdAt: NOW,
  updatedAt: NOW,
};

const row: RepoCartItemPayload = {
  id: CART_ITEM_ID,
  cartId: CART_ID,
  productId: PRODUCT_ID,
  sizeId: SIZE_ID,
  quantity: 5,
  createdAt: NOW,
  updatedAt: NOW,
  cart,
  size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' },
  product: {
    id: PRODUCT_ID,
    storeId: 'store-1',
    name: 'Test Product',
    price: new Prisma.Decimal(100),
    image: 'img.jpg',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    createdAt: NOW,
    updatedAt: NOW,
    content: null,
    categoryId: null,
    isSoldOut: false,
    store: {
      id: 'store-1',
      name: 'Shop',
      content: 'Desc',
      image: 'store.jpg',
      createdAt: NOW,
      updatedAt: NOW,
    } as RepoCartItemPayload['product']['store'],
    Stock: [
      {
        id: 'S1',
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 10,
        size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' },
      },
    ] as RepoCartItemPayload['product']['Stock'],
  },
};

describe('CartService', () => {
  beforeEach(() => {
    repo = mockDeep<CartRepository>();
    service = new CartService(repo);

    jest.clearAllMocks();

    // 공통 mock
    repo.getOrCreateCartByBuyer.mockResolvedValue(cart);
    repo.recalcCartQuantity.mockResolvedValue(undefined);

    // 정확한 시그니처로 DTO 변환기 구현
    repo.toCartItemDto.mockImplementation((it: RepoCartItemPayload): CartItemDto => {
      const p = it.product;
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
          storeName: p.store.name,
          name: p.name,
          image: p.image,
          price: Number(p.price),
          discountRate: p.discountRate,
          discountStartTime: p.discountStartTime ? p.discountStartTime.toISOString() : null,
          discountEndTime: p.discountEndTime ? p.discountEndTime.toISOString() : null,
          isSoldOut: p.isSoldOut ?? false,
          stocks: p.Stock.map((s) => ({
            id: s.id,
            quantity: s.quantity,
            size: { id: s.sizeId, name: s.size.ko },
          })),
          store: { id: p.store.id, name: p.store.name },
        },
      };
    });
  });

  // --- CREATE ---
  describe('createCartItem', () => {
    const input: CreateCartItemDto = { productId: PRODUCT_ID, sizeId: SIZE_ID, quantity: 2 };

    it('기존 없으면 생성 후 CartDto 반환', async () => {
      repo.findCartItem.mockResolvedValue(null);

      const res = await service.createCartItem(BUYER_ID, input);

      const expectedCreate: Prisma.CartItemCreateInput = {
        cart: { connect: { id: CART_ID } },
        product: { connect: { id: PRODUCT_ID } },
        size: { connect: { id: SIZE_ID } },
        quantity: 2,
      };
      expect(repo.createCartItem).toHaveBeenCalledWith(expectedCreate);
      expect(repo.updateCartItem).not.toHaveBeenCalled();
      expect(repo.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);

      const r = res as CartDto;
      expect(r.id).toBe(CART_ID);
      expect(typeof r.createdAt).toBe('string');
      expect(typeof r.updatedAt).toBe('string');
    });

    it('기존 있으면 수량 합산 업데이트', async () => {
      const existing: PrismaCartItem = {
        id: CART_ITEM_ID,
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 3,
        createdAt: NOW,
        updatedAt: NOW,
      };
      repo.findCartItem.mockResolvedValue(existing);

      await service.createCartItem(BUYER_ID, input);

      expect(repo.createCartItem).not.toHaveBeenCalled();
      expect(repo.updateCartItem).toHaveBeenCalledWith(CART_ITEM_ID, 5);
      expect(repo.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);
    });
  });

  // --- READ LIST ---
  describe('getCartItems', () => {
    it('CartResponseDto로 반환', async () => {
      repo.findAllCartItems.mockResolvedValue([row]);

      const res = await service.getCartItems(BUYER_ID);

      expect(repo.findAllCartItems).toHaveBeenCalledWith(CART_ID);
      expect(res.id).toBe(CART_ID);
      expect(res.items).toHaveLength(1);
      expect(typeof res.createdAt).toBe('string');
      expect(typeof res.updatedAt).toBe('string');
    });
  });

  // --- READ DETAIL ---
  describe('getCartItem', () => {
    it('단건 상세 반환', async () => {
      repo.findCartItemDetail.mockResolvedValue(row);

      const result = await service.getCartItem(BUYER_ID, CART_ITEM_ID);

      const detail = result as CartItemDetailDto;
      expect(repo.findCartItemDetail).toHaveBeenCalledWith(CART_ITEM_ID, BUYER_ID);
      expect(detail.id).toBe(CART_ITEM_ID);
      expect(detail.product.storeId).toBe(row.product.storeId);
      expect(detail.product.storeName).toBe(row.product.store.name);
      expect(typeof detail.createdAt).toBe('string');
      expect(typeof detail.updatedAt).toBe('string');
    });

    it('없으면 NotFoundError', async () => {
      repo.findCartItemDetail.mockRejectedValue(new NotFoundError('not found'));
      await expect(service.getCartItem(BUYER_ID, 'x')).rejects.toThrow(NotFoundError);
    });
  });

  // --- PATCH ---
  describe('patchCartItems', () => {
    it('기존이면 수량 수정 후 배열 반환', async () => {
      const dto: UpdateCartBySizesDto = {
        productId: PRODUCT_ID,
        sizes: [{ sizeId: SIZE_ID, quantity: 10 }],
      };

      const existing: PrismaCartItem = {
        id: CART_ITEM_ID,
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 5,
        createdAt: NOW,
        updatedAt: NOW,
      };

      repo.findCartItem.mockResolvedValue(existing);
      repo.findAllCartItems.mockResolvedValue([{ ...row, quantity: 10 } as RepoCartItemPayload]);

      const result = await service.patchCartItems(BUYER_ID, dto);
      const list = result as CartItemDto[];

      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(1);

      const first: CartItemDto | undefined = list[0];
      if (!first) {
        throw new Error('expected one item');
      }
      expect(first.quantity).toBe(10);
    });

    it('수량 0이면 삭제', async () => {
      const dto: UpdateCartBySizesDto = {
        productId: PRODUCT_ID,
        sizes: [{ sizeId: SIZE_ID, quantity: 0 }],
      };

      const existing: PrismaCartItem = {
        id: CART_ITEM_ID,
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 5,
        createdAt: NOW,
        updatedAt: NOW,
      };

      repo.findCartItem.mockResolvedValue(existing);
      repo.findAllCartItems.mockResolvedValue([]);

      const result = await service.patchCartItems(BUYER_ID, dto);

      expect(repo.deleteCartItem).toHaveBeenCalledWith(CART_ITEM_ID);
      expect(Array.isArray(result)).toBe(true);
      expect((result as CartItemDto[]).length).toBe(0);
    });
  });

  // --- DELETE ---
  describe('removeCartItem', () => {
    it('삭제 후 카트 수량 재계산', async () => {
      repo.findCartItemDetail.mockResolvedValue(row);

      await service.removeCartItem(BUYER_ID, CART_ITEM_ID);

      expect(repo.findCartItemDetail).toHaveBeenCalledWith(CART_ITEM_ID, BUYER_ID);
      expect(repo.deleteCartItem).toHaveBeenCalledWith(CART_ITEM_ID);
      expect(repo.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);
    });
  });
});
