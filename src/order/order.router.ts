import { Router, Request, Response, NextFunction } from 'express';
import OrderController from './order.controller';
import OrderService from './order.service';
import { OrderRepository } from './order.repository';
import validateDto from '../common/utils/validate.dto';
import { CreateOrderDto } from './dtos/create-order.dto';
import { UpdateOrderDto } from './dtos/update-order.dto';
import passport from 'passport';
import { authorizeBuyer } from '../middleware/authorization';

const repo = new OrderRepository();
const service = new OrderService(repo);
const controller = new OrderController(service);

type Middleware = (req: Request, res: Response, next: NextFunction) => void;
const ensureBodyExists: Middleware = (req, res, next) => {
  if (!req.body) {
    res
      .status(400)
      .json({ statusCode: 400, message: '요청 본문이 필요합니다.', error: 'Bad Request' });
    return;
  }
  next();
};

const router = Router();
router.use(passport.authenticate('jwt', { session: false }), authorizeBuyer);

router.post(
  '/',
  ensureBodyExists,
  validateDto(CreateOrderDto) as Middleware,
  controller.createOrder
);
router.get('/', controller.getOrderList);
router.get('/:orderId', controller.getOrderDetail);
router.patch(
  '/:orderId',
  ensureBodyExists,
  validateDto(UpdateOrderDto) as Middleware,
  controller.updateOrder
);
router.delete('/:orderId', controller.deleteOrder);

export default router;
