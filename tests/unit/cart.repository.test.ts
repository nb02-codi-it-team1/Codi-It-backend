// src/cart/cart.repository.test.ts

import {
  PrismaClient,
  Prisma,
  Cart as PrismaCart,
  CartItem as PrismaCartItem,
} from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import CartRepository from '../../src/cart/cart.repository';
import { NotFoundError } from '../../src/common/errors/error-type';

// 레포 메서드 시그니처에서 정확한 Payload 타입 추론
type RepoCartItemPayload = Parameters<CartRepository['toCartItemDto']>[0];

let mockPrisma: DeepMockProxy<PrismaClient>;
let cartRepository: CartRepository;

const BUYER_ID = 'user-test-123';
const CART_ID = 'cart-test-ABC';
const PRODUCT_ID = 'prod-A';
const SIZE_ID = 1;
const CART_ITEM_ID = 'item-XYZ';
const NOW = new Date('2025-01-01T00:00:00.000Z');
const PRICE_DECIMAL = new Prisma.Decimal(150.5);

// 공통 목업: Prisma Cart (원본 Date)
const cart: PrismaCart = {
  id: CART_ID,
  buyerId: BUYER_ID,
  quantity: 5,
  createdAt: NOW,
  updatedAt: NOW,
};

// Repository DTO 변환에 사용할 Prisma Payload 한 건
const mockPayload: RepoCartItemPayload = {
  id: CART_ITEM_ID,
  cartId: CART_ID,
  productId: PRODUCT_ID,
  sizeId: SIZE_ID,
  quantity: 5,
  createdAt: NOW,
  updatedAt: NOW,
  cart,
  product: {
    id: PRODUCT_ID,
    storeId: 'store-1',
    name: 'Test Product',
    price: PRICE_DECIMAL,
    image: 'img.jpg',
    discountRate: 0,
    discountStartTime: null,
    discountEndTime: null,
    createdAt: NOW,
    updatedAt: NOW,
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
  } as unknown as RepoCartItemPayload['product'],
  size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' },
};

describe('CartRepository 유닛 테스트', () => {
  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    cartRepository = new CartRepository(mockPrisma as unknown as PrismaClient);
    jest.clearAllMocks();
  });

  // 1) DTO 변환 로직
  describe('DTO 변환 (toCartItemDto)', () => {
    test('Prisma Payload → CartItemDto 변환', () => {
      const dto = cartRepository.toCartItemDto(mockPayload);

      expect(dto.id).toBe(CART_ITEM_ID);
      expect(dto.product.price).toBe(150.5);
      expect(dto.createdAt).toBe(NOW.toISOString());
      expect(dto.product.store.id).toBe('store-1');
    });
  });

  // 2) 장바구니 조회/생성
  describe('getOrCreateCartByBuyer', () => {
    test('기존 장바구니가 있으면 조회', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(cart);

      const result = await cartRepository.getOrCreateCartByBuyer(BUYER_ID);

      expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({ where: { buyerId: BUYER_ID } });
      expect(mockPrisma.cart.create).not.toHaveBeenCalled();
      expect(result.id).toBe(CART_ID);
    });

    test('없으면 생성', async () => {
      mockPrisma.cart.findUnique.mockResolvedValue(null);
      mockPrisma.cart.create.mockResolvedValue(cart);

      const result = await cartRepository.getOrCreateCartByBuyer('new-buyer');

      expect(mockPrisma.cart.findUnique).toHaveBeenCalled();
      expect(mockPrisma.cart.create).toHaveBeenCalledWith({
        data: { buyerId: 'new-buyer', quantity: 0 },
      });
      expect(result.id).toBe(CART_ID);
    });
  });

  // 3) 단일 상세 조회
  describe('findCartItemDetail', () => {
    test('정상 조회', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(mockPayload);

      const result = await cartRepository.findCartItemDetail(CART_ITEM_ID, BUYER_ID);

      expect(mockPrisma.cartItem.findFirst).toHaveBeenCalled();
      expect(result.id).toBe(CART_ITEM_ID);
    });

    test('없으면 NotFoundError', async () => {
      mockPrisma.cartItem.findFirst.mockResolvedValue(null);

      await expect(cartRepository.findCartItemDetail('invalid', BUYER_ID)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  // 4) 수량 재계산
  describe('recalcCartQuantity', () => {
    test('합산 후 Cart 업데이트', async () => {
      const items: PrismaCartItem[] = [
        {
          id: 'ci-1',
          cartId: CART_ID,
          productId: PRODUCT_ID,
          sizeId: SIZE_ID,
          quantity: 2,
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: 'ci-2',
          cartId: CART_ID,
          productId: PRODUCT_ID,
          sizeId: SIZE_ID,
          quantity: 3,
          createdAt: NOW,
          updatedAt: NOW,
        },
      ];

      mockPrisma.cartItem.findMany.mockResolvedValue(items);
      mockPrisma.cart.update.mockResolvedValue({
        id: CART_ID,
        buyerId: BUYER_ID,
        quantity: 5,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await cartRepository.recalcCartQuantity(CART_ID);

      expect(mockPrisma.cartItem.findMany).toHaveBeenCalledWith({ where: { cartId: CART_ID } });
      expect(mockPrisma.cart.update).toHaveBeenCalledWith({
        where: { id: CART_ID },
        data: { quantity: 5 },
      });
    });
  });

  // 5) CRUD
  describe('CRUD 기본 동작', () => {
    test('createCartItem → prisma.create 호출', async () => {
      const data: Prisma.CartItemCreateInput = {
        cart: { connect: { id: CART_ID } },
        product: { connect: { id: PRODUCT_ID } },
        size: { connect: { id: SIZE_ID } },
        quantity: 10,
      };
      mockPrisma.cartItem.create.mockResolvedValue({
        id: 'new',
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 10,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await cartRepository.createCartItem(data);

      expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({ data });
    });

    test('updateCartItem → prisma.update 호출', async () => {
      mockPrisma.cartItem.update.mockResolvedValue({
        id: CART_ITEM_ID,
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 8,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await cartRepository.updateCartItem(CART_ITEM_ID, 8);

      expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: CART_ITEM_ID },
        data: { quantity: 8 },
      });
    });

    test('deleteCartItem → prisma.delete 호출', async () => {
      mockPrisma.cartItem.delete.mockResolvedValue({
        id: CART_ITEM_ID,
        cartId: CART_ID,
        productId: PRODUCT_ID,
        sizeId: SIZE_ID,
        quantity: 5,
        createdAt: NOW,
        updatedAt: NOW,
      });

      await cartRepository.deleteCartItem(CART_ITEM_ID);

      expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: CART_ITEM_ID } });
    });
  });
});
