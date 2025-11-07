// src/cart/cart.service.test.ts

import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import CartService from '../../src/cart/cart.service';
import CartRepository from '../../src/cart/cart.repository';
import { Prisma } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../../src/common/errors/error-type';

// --- Mock 설정 ---
let mockCartRepository: DeepMockProxy<CartRepository>;
let cartService: CartService;

const BUYER_ID = 'user-test-123';
const CART_ID = 'cart-test-ABC';
const PRODUCT_ID = 'prod-A';
const SIZE_ID = 1;
const CART_ITEM_ID = 'item-XYZ';
const NOW = new Date();
const NOW_ISO = NOW.toISOString();

// Mock Cart 및 CartItem 데이터 구조 (Prisma 반환 타입)
const mockCart = {
    id: CART_ID,
    buyerId: BUYER_ID,
    quantity: 5,
    createdAt: NOW,
    updatedAt: NOW,
};

const mockCartItemPrismaPayload = {
    id: CART_ITEM_ID,
    cartId: CART_ID,
    productId: PRODUCT_ID,
    sizeId: SIZE_ID,
    quantity: 5,
    createdAt: NOW,
    updatedAt: NOW,
    cart: mockCart,
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
        store: { id: 'store-1', userId: 'seller-1', name: 'Shop', address: 'Addr', phoneNumber: '000', content: 'Desc', image: 'store.jpg', createdAt: NOW, updatedAt: NOW },
        Stock: [{ id: 'S1', productId: PRODUCT_ID, sizeId: SIZE_ID, quantity: 10, size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' } }],
    },
    size: { id: SIZE_ID, name: 'S', ko: '소', en: 'S' },
};


// --- Test Suite 시작 ---
describe('CartService 유닛 테스트', () => {
    beforeEach(() => {
        // 매 테스트마다 새로운 Mock과 Service 인스턴스 생성
        mockCartRepository = mockDeep<CartRepository>();
        cartService = new CartService(mockCartRepository as any);

        jest.clearAllMocks();

        // 공통 Mock 설정
        mockCartRepository.getOrCreateCartByBuyer.mockResolvedValue(mockCart);
        mockCartRepository.recalcCartQuantity.mockResolvedValue(undefined);
    });

    // --- 1. POST /api/cart (아이템 생성/추가) 테스트 ---
    describe('장바구니 아이템 추가 (createCartItem)', () => {
        const createDto = { productId: PRODUCT_ID, sizeId: SIZE_ID, quantity: 2 };

        test('기존 아이템이 없을 경우, 새로 생성하고 201 응답까지의 처리 시간 확인', async () => {
            // Setup: 기존 아이템 없음
            mockCartRepository.findCartItem.mockResolvedValue(null);
            mockCartRepository.createCartItem.mockResolvedValue({} as any);
            mockCartRepository.getOrCreateCartByBuyer.mockResolvedValueOnce(mockCart).mockResolvedValue(mockCart); // 첫 호출: 기존 카트, 두 번째 호출: 업데이트된 카트

            const startTime = process.hrtime.bigint();
            const result = await cartService.createCartItem(BUYER_ID, createDto);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.createCartItem).toHaveBeenCalled();
            expect(mockCartRepository.updateCartItem).not.toHaveBeenCalled();
            expect(mockCartRepository.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);

            expect(result.id).toBe(CART_ID);
        });

        test('기존 아이템이 있을 경우, 수량 업데이트하고 201 응답까지의 처리 시간 확인', async () => {
            // Setup: 기존 아이템 있음
            const existingItem = { id: CART_ITEM_ID, quantity: 3, cartId: CART_ID, productId: PRODUCT_ID, sizeId: SIZE_ID, createdAt: NOW, updatedAt: NOW };
            mockCartRepository.findCartItem.mockResolvedValue(existingItem);
            mockCartRepository.updateCartItem.mockResolvedValue({} as any);

            const startTime = process.hrtime.bigint();
            await cartService.createCartItem(BUYER_ID, createDto);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.createCartItem).not.toHaveBeenCalled();
            expect(mockCartRepository.updateCartItem).toHaveBeenCalledWith(CART_ITEM_ID, 5);
            expect(mockCartRepository.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);
        });
    });

    // --- 2. GET /api/cart (전체 조회) 테스트 ---
    describe('장바구니 전체 조회 (getCartItems)', () => {
        test('전체 아이템 목록을 DTO로 변환하여 반환하고 처리 시간 확인', async () => {
            // Setup: Mock Repository 반환값 설정
            mockCartRepository.findAllCartItems.mockResolvedValue([mockCartItemPrismaPayload] as any);
            mockCartRepository.toCartItemDto.mockReturnValue({ id: CART_ITEM_ID, quantity: 5 } as any);

            const startTime = process.hrtime.bigint();
            const result = await cartService.getCartItems(BUYER_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.findAllCartItems).toHaveBeenCalledWith(CART_ID);
            expect(mockCartRepository.toCartItemDto).toHaveBeenCalledTimes(1);
            expect(result.items).toHaveLength(1);
            expect(result.id).toBe(CART_ID);
        });
    });

    // --- 3. GET /api/cart/:cartItemId (단건 조회) 테스트 ---
    describe('장바구니 아이템 단건 조회 (getCartItem)', () => {
        test('유효한 아이템 ID로 상세 정보를 DTO로 반환하고 처리 시간 확인', async () => {
            // Setup: Repository가 상세 정보 (Payload)를 반환
            mockCartRepository.findCartItemDetail.mockResolvedValue(mockCartItemPrismaPayload as any);
            mockCartRepository.toCartItemDto.mockReturnValue({ id: CART_ITEM_ID, quantity: 5 } as any);

            const startTime = process.hrtime.bigint();
            const result = await cartService.getCartItem(BUYER_ID, CART_ITEM_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.findCartItemDetail).toHaveBeenCalledWith(CART_ITEM_ID, BUYER_ID);
            expect(result.id).toBe(CART_ITEM_ID);
            expect(result.cart.id).toBe(CART_ID);
        });

        test('Repository에서 NotFoundError 발생 시, 에러가 전파되는지 확인', async () => {
            mockCartRepository.findCartItemDetail.mockRejectedValue(new NotFoundError('Item not found'));

            await expect(cartService.getCartItem(BUYER_ID, 'invalid-id')).rejects.toThrow(NotFoundError);
        });
    });

    // --- 4. PATCH /api/cart (수정/다중 삭제) 테스트 ---
    describe('장바구니 아이템 수정/삭제 (patchCartItems)', () => {
        const patchDto = { productId: PRODUCT_ID, sizes: [{ sizeId: SIZE_ID, quantity: 10 }] };
        const existingItem = { id: CART_ITEM_ID, quantity: 5, cartId: CART_ID, productId: PRODUCT_ID, sizeId: SIZE_ID, createdAt: NOW, updatedAt: NOW };

        test('기존 아이템 수량 수정 후 DTO 목록 반환 및 처리 시간 확인', async () => {
            // Setup
            mockCartRepository.findCartItem.mockResolvedValue(existingItem);
            mockCartRepository.updateCartItem.mockResolvedValue({} as any);
            mockCartRepository.findAllCartItems.mockResolvedValue([mockCartItemPrismaPayload] as any);
            mockCartRepository.toCartItemDto.mockReturnValue({ id: CART_ITEM_ID, quantity: 10 } as any);

            const startTime = process.hrtime.bigint();
            const result = await cartService.patchCartItems(BUYER_ID, patchDto);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.updateCartItem).toHaveBeenCalledWith(CART_ITEM_ID, 10);
            expect(mockCartRepository.deleteCartItem).not.toHaveBeenCalled();
            expect(result).toHaveLength(1);
        });

        test('수량 0으로 설정 시 아이템 삭제 후 처리 시간 확인', async () => {
            // Setup
            const deleteDto = { productId: PRODUCT_ID, sizes: [{ sizeId: SIZE_ID, quantity: 0 }] };
            mockCartRepository.findCartItem.mockResolvedValue(existingItem);
            mockCartRepository.deleteCartItem.mockResolvedValue(undefined);
            mockCartRepository.findAllCartItems.mockResolvedValue([]);
            
            const startTime = process.hrtime.bigint();
            const result = await cartService.patchCartItems(BUYER_ID, deleteDto);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.deleteCartItem).toHaveBeenCalledWith(CART_ITEM_ID);
            expect(mockCartRepository.updateCartItem).not.toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });
    });

    // --- 5. DELETE /api/cart/:cartItemId (단건 삭제) 테스트 ---
    describe('장바구니 아이템 단건 삭제 (removeCartItem)', () => {
        test('아이템 삭제 후 수량 재계산까지의 처리 시간 확인', async () => {
            // Setup
            mockCartRepository.findCartItemDetail.mockResolvedValue(mockCartItemPrismaPayload as any);
            mockCartRepository.deleteCartItem.mockResolvedValue(undefined);

            const startTime = process.hrtime.bigint();
            await cartService.removeCartItem(BUYER_ID, CART_ITEM_ID);
            const endTime = process.hrtime.bigint();
            const elapsedTimeMs = Number(endTime - startTime) / 1_000_000;

            expect(mockCartRepository.findCartItemDetail).toHaveBeenCalledWith(CART_ITEM_ID, BUYER_ID);
            expect(mockCartRepository.deleteCartItem).toHaveBeenCalledWith(CART_ITEM_ID);
            expect(mockCartRepository.recalcCartQuantity).toHaveBeenCalledWith(CART_ID);
        });
    });
});