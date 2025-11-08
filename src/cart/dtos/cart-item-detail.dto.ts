import { CartDto } from './cart.dto';
import { CartItemDto } from './cart-item.dto';

export type CartItemDetailDto = CartItemDto & {
  cart: CartDto;
};
