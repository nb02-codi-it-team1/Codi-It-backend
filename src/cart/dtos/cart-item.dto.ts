export type CartItemDto = {
    id: string;
    cartId: string;
    productId: string;
    sizeId: number;
    quantity: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    product: any;
};