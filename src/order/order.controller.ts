import { Request, Response } from 'express';
import OrderService from './order.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';

export default class OrderController {
  constructor(private readonly service: OrderService) {}

  private getUserId(req: Request, res: Response): string | null {
    const userId = (req.user as { id?: string } | undefined)?.id;
    if (!userId) {
      res
        .status(401)
        .json({ statusCode: 401, message: '인증이 필요합니다.', error: 'Unauthorized' });
      return null;
    }
    return userId;
  }

  createOrder = async (req: Request, res: Response) => {
    const userId = this.getUserId(req, res);
    if (!userId) return;

    const dto = req.body as CreateOrderDto;

    try {
      const created =
        dto.orderItems && dto.orderItems.length > 0
          ? await this.service.createOrder(userId, dto)
          : await this.service.createOrderFromCart(userId, {
              name: dto.name,
              phoneNumber: dto.phoneNumber,
              address: dto.address,
              usePoint: dto.usePoint,
            });

      res.status(201).json(created);
    } catch (e) {
      res
        .status(400)
        .json({ statusCode: 400, message: (e as Error).message, error: 'Bad Request' });
    }
  };

  getOrderList = async (req: Request, res: Response) => {
    const userId = this.getUserId(req, res);
    if (!userId) return;

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);
    const result = await this.service.getOrderList(userId, page, limit);
    res.json(result);
  };

  getOrderDetail = async (req: Request, res: Response) => {
    const userId = this.getUserId(req, res);
    if (!userId) return;

    const { orderId } = req.params as { orderId: string };
    const row = await this.service.getOrderDetail(userId, orderId);
    if (!row) {
      res
        .status(404)
        .json({ statusCode: 404, message: '주문을 찾을 수 없습니다.', error: 'Not Found' });
      return;
    }
    res.json(row);
  };

  updateOrder = async (req: Request, res: Response) => {
    const userId = this.getUserId(req, res);
    if (!userId) return;
    const { orderId } = req.params as { orderId: string };
    const dto = req.body as UpdateOrderDto;
    try {
      const updated = await this.service.updateOrder(userId, orderId, dto);
      res.json(updated);
    } catch (e) {
      res
        .status(400)
        .json({ statusCode: 400, message: (e as Error).message, error: 'Bad Request' });
    }
  };

  deleteOrder = async (_req: Request, res: Response) => {
    res.status(204).send();
  };
}
