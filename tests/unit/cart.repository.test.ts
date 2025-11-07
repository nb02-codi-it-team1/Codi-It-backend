// src/cart/cart.repository.test.ts

import { PrismaClient, Prisma, CartItem } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import CartRepository from '../../src/cart/cart.repository';
import { NotFoundError } from '../../src/common/errors/error-type';

// --- Mock 설정 ---
let mockPrisma: DeepMockProxy<PrismaClient>;
let cartRepository: CartRepository;

const BUYER_ID = 'user-test-123';
const CART_ID = 'cart-test-ABC';
const PRODUCT_ID = 'prod-A';
const SIZE_ID = 1;
const CART_ITEM_ID = 'item-XYZ';
const NOW = new Date('2025-01-01T00:00:00.000Z');
const PRICE_DECIMAL = new Prisma.Decimal(150.50);

// Repository DTO 변환에 필요한 Mock 데이터 (Prisma Payload 구조)
const mockPrismaCartItem = {
    id: CART_ITEM_ID,
    cartId: CART_ID,
    productId: PRODUCT_ID,
    sizeId: SIZE_ID,
    quantity: 5,
    createdAt: NOW,
    updatedAt: NOW,
    cart: { id: CART_ID, buyerId: BUYER_ID, quantity: 5, createdAt: NOW, updatedAt: NOW },
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
        store: { id: 'store-1', userId: 'seller-1', name: 'Shop', address: 'Addr', phoneNumber: '000', content: 'Desc', image: 'store.jpg', createdAt: NOW, updatedAt: NOW },
        Stock: [{ id: 'S1', productId: PRODUCT_ID, sizeId: SIZE_ID, quantity: 10, size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' } }],
    },
    size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' },
};


// --- Test Suite 시작 ---
describe('CartRepository 유닛 테스트', () => {
    beforeEach(() => {
        mockPrisma = mockDeep<PrismaClient>();
        cartRepository = new CartRepository(mockPrisma as unknown as PrismaClient);
        jest.clearAllMocks();
    });

    // --- 1. DTO 변환 로직 테스트 ---
    describe('DTO 변환 (toCartItemDto)', () => {
        test('Prisma Payload를 정확하게 CartItemDto로 변환하는지 확인', () => {
            const startTime = process.hrtime.bigint();
            const result = cartRepository.toCartItemDto(mockPrismaCartItem as any);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(result.id).toBe(CART_ITEM_ID);
            expect(result.product.price).toBe(150.50); // Decimal to Number 변환 확인
            expect(result.createdAt).toBe(NOW.toISOString()); // Date to ISOString 변환 확인
            expect(result.product.store.id).toBe('store-1');
        });
    });

    // --- 2. 장바구니 생성/조회 (getOrCreateCartByBuyer) 테스트 ---
    describe('장바구니 조회 또는 생성 (getOrCreateCartByBuyer)', () => {
        test('기존 장바구니가 있을 경우 조회하고 처리 시간 확인', async () => {
            mockPrisma.cart.findUnique.mockResolvedValue(mockPrismaCartItem.cart);

            const startTime = process.hrtime.bigint();
            const result = await cartRepository.getOrCreateCartByBuyer(BUYER_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cart.findUnique).toHaveBeenCalledWith({ where: { buyerId: BUYER_ID } });
            expect(mockPrisma.cart.create).not.toHaveBeenCalled();
            expect(result.id).toBe(CART_ID);
        });

        test('장바구니가 없을 경우 새로 생성하고 처리 시간 확인', async () => {
            mockPrisma.cart.findUnique.mockResolvedValue(null);
            mockPrisma.cart.create.mockResolvedValue(mockPrismaCartItem.cart); // 생성된 객체 반환

            const startTime = process.hrtime.bigint();
            const result = await cartRepository.getOrCreateCartByBuyer('new-buyer');
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cart.findUnique).toHaveBeenCalled();
            expect(mockPrisma.cart.create).toHaveBeenCalledWith({ data: { buyerId: 'new-buyer', quantity: 0 } });
            expect(result.id).toBe(CART_ID);
        });
    });
    
    // --- 3. 단일 상세 조회 (findCartItemDetail) 테스트 ---
    describe('아이템 단일 상세 조회 (findCartItemDetail)', () => {
        test('유효한 아이템 조회 성공 후 처리 시간 확인', async () => {
            mockPrisma.cartItem.findFirst.mockResolvedValue(mockPrismaCartItem as any);
            
            const startTime = process.hrtime.bigint();
            const result = await cartRepository.findCartItemDetail(CART_ITEM_ID, BUYER_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cartItem.findFirst).toHaveBeenCalled();
            expect(result.id).toBe(CART_ITEM_ID);
        });
        
        test('아이템이 없을 경우 NotFoundError 발생 확인', async () => {
            mockPrisma.cartItem.findFirst.mockResolvedValue(null);

            await expect(cartRepository.findCartItemDetail('invalid-id', BUYER_ID)).rejects.toThrow(NotFoundError);
        });
    });

    // --- 4. 수량 재계산 (recalcCartQuantity) 테스트 ---
    describe('수량 재계산 (recalcCartQuantity)', () => {
        test('장바구니 아이템 수량을 합산하여 Cart에 업데이트하는지 확인', async () => {
            const items = [{ quantity: 2 }, { quantity: 3 }] as any;
            mockPrisma.cartItem.findMany.mockResolvedValue(items);
            mockPrisma.cart.update.mockResolvedValue({} as any);

            const startTime = process.hrtime.bigint();
            await cartRepository.recalcCartQuantity(CART_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cartItem.findMany).toHaveBeenCalledWith({ where: { cartId: CART_ID } });
            expect(mockPrisma.cart.update).toHaveBeenCalledWith({ where: { id: CART_ID }, data: { quantity: 5 } });
        });
    });

    // --- 5. CRUD 기본 동작 테스트 ---
    describe('CRUD 기본 동작', () => {
        test('아이템 생성 (createCartItem)이 Prisma.create를 호출하는지 확인', async () => {
            const data: Prisma.CartItemCreateInput = { quantity: 10 } as any;
            mockPrisma.cartItem.create.mockResolvedValue({} as any);

            const startTime = process.hrtime.bigint();
            await cartRepository.createCartItem(data);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cartItem.create).toHaveBeenCalledWith({ data });
        });

        test('아이템 업데이트 (updateCartItem)가 Prisma.update를 호출하는지 확인', async () => {
            mockPrisma.cartItem.update.mockResolvedValue({} as any);
            const newQuantity = 8;

            const startTime = process.hrtime.bigint();
            await cartRepository.updateCartItem(CART_ITEM_ID, newQuantity);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cartItem.update).toHaveBeenCalledWith({ where: { id: CART_ITEM_ID }, data: { quantity: newQuantity } });
        });
        
        test('아이템 삭제 (deleteCartItem)가 Prisma.delete를 호출하는지 확인', async () => {
            mockPrisma.cartItem.delete.mockResolvedValue({} as any);

            const startTime = process.hrtime.bigint();
            await cartRepository.deleteCartItem(CART_ITEM_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockPrisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: CART_ITEM_ID } });
        });
    });
});