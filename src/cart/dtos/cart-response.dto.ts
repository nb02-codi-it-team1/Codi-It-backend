import { CartDto } from './cart.dto';
import { CartItemDto } from './cart-item.dto';

export type CartResponseDto = CartDto & {
    items: CartItemDto[];
};