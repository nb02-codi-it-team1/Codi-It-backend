import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import { OrderRepository, FrontOrder, FrontOrderListResponse } from './order.repository';

export type CreateOrderFromCartDto = {
  name: string;
  phoneNumber: string;
  address: string;
  usePoint: number;
};

export default class OrderService {
  constructor(private readonly repo: OrderRepository) {}

  async createOrder(userId: string, dto: CreateOrderDto): Promise<FrontOrder> {
    return this.repo.createOrderTransaction(userId, dto);
  }

  async createOrderFromCart(userId: string, dto: CreateOrderFromCartDto): Promise<FrontOrder> {
    return this.repo.createOrderFromCart(userId, dto);
  }

  async getOrderList(userId: string, page: number, limit: number): Promise<FrontOrderListResponse> {
    const safePage = Math.max(1, Math.trunc(page));
    const safeLimit = Math.min(100, Math.max(1, Math.trunc(limit)));
    const skip = (safePage - 1) * safeLimit;
    return this.repo.findOrdersByBuyer(userId, skip, safeLimit);
  }

  async getOrderDetail(userId: string, orderId: string): Promise<FrontOrder | null> {
    return this.repo.findOrderDetail(userId, orderId);
  }

  async updateOrder(userId: string, orderId: string, dto: UpdateOrderDto): Promise<FrontOrder> {
    return this.repo.updateOrder(userId, orderId, dto);
  }

  async deleteOrder(userId: string, orderId: string): Promise<void> {
    await this.repo.deleteOrder(userId, orderId);
  }
}
