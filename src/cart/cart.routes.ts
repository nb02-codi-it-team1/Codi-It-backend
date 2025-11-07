import { Router, Request, Response, NextFunction } from 'express';
import CartController from './cart.controller';
import CartService from './cart.service';
import CartRepository from './cart.repository';
import prisma from '../common/prisma/client'; 
import validateDto from '../common/utils/validate.dto'; 
import passport from 'passport'; 
import { authorizeBuyer } from '../middleware/authorization';
import { UpdateCartBySizesDto } from './dtos/update-cart-by-sizes.dto';

type Middleware = (req: Request, res: Response, next: NextFunction) => void;

// 🚨 500 런타임 에러 방지 미들웨어 유지 (req.body를 {}로 초기화)
const ensureBodyExists = (req: Request, res: Response, next: NextFunction) => {
    if (req.body === undefined || req.body === null || (typeof req.body === 'string' && req.body.length === 0)) {
        req.body = {};
    }
    next();
};


export const buildCartRouter = (): Router => {
    const repository = new CartRepository(prisma);
    const service = new CartService(repository);
    const controller = new CartController(service);
    const router = Router();

    router.use(
        passport.authenticate('jwt', { session: false }), 
        authorizeBuyer                                   
    );

    // --- POST /api/cart (장바구니 생성 또는 아이템 추가) ---
    router.post(
        '/',
        ensureBodyExists,
        controller.createCartItem
    );

    // --- PATCH /api/cart (수정) ---
    // 이 라우트는 아이템을 추가/수정하는 용도이므로 DTO 유효성 검사를 유지해야 합니다.
    router.patch(
        '/',
        ensureBodyExists,                               
        validateDto(UpdateCartBySizesDto) as Middleware, 
        controller.patchCartItems
    );

    router.get('/', controller.getCartItems);
    router.get('/:cartItemId', controller.getCartItem);
    router.delete('/:cartItemId', controller.removeCartItem);

    return router;
};