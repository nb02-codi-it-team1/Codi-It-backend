import { Request, Response, NextFunction } from 'express';
import CartService from './cart.service';
import { CreateCartItemDto } from './dtos/create-cart-item.dto';
import { UpdateCartBySizesDto } from './dtos/update-cart-by-sizes.dto';

export default class CartController {
    constructor(private readonly service: CartService) {}

    private checkUserId(req: Request, res: Response): string | null {
        const userId = req.user?.id; 
        
        if (typeof userId !== 'string') { 
            res.status(401).json({ statusCode: 401, message: "인증이 필요합니다. (User ID missing)", error: "Unauthorized" });
            return null;
        }
        return userId;
    }

    // --- POST /api/cart (장바구나 및 아이템 추가) ---
   createCartItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.checkUserId(req, res);
            if (!userId) return; 

            const dto: CreateCartItemDto = req.body; 

            // 상품 정보가 있다면 아이템을 추가하고, 없다면 장바구니만 생성
            if (!dto.productId) {
                // 프론트가 빈 Body를 보낸 경우 (장바구니 생성 요청으로 간주)
                const cartDto = await this.service.getCartItems(userId); 
                return res.status(201).json(cartDto);
            }
            
            // 상품 정보가 있는 경우 (아이템 추가 요청으로 간주)
            const cartDto = await this.service.createCartItem(userId, dto);
            res.status(201).json(cartDto);
        } catch (e) {
            return next(e); 
        }
    }

    // --- GET /api/cart (전체 조회) ---
    getCartItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.checkUserId(req, res);
            if (!userId) return;

            const cartResponse = await this.service.getCartItems(userId);
            res.status(200).json(cartResponse);
        } catch (e) {
            return next(e); 
        }
    }

    // --- PATCH /api/cart (수정/다중 삭제) ---
    patchCartItems = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.checkUserId(req, res);
            if (!userId) return;

            const dto: UpdateCartBySizesDto = req.body;
            const items = await this.service.patchCartItems(userId, dto);
            res.status(200).json(items);
        } catch (e) {
            return next(e); 
        }
    }

    // --- GET /api/cart/:cartItemId (단건 조회) ---
    getCartItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.checkUserId(req, res);
            if (!userId) return;
            
            const { cartItemId } = req.params;
            if (typeof cartItemId !== 'string') {
                return res.status(400).json({ statusCode: 400, message: "cartItemId가 누락되었습니다.", error: "Bad Request" });
            }

            const item = await this.service.getCartItem(userId, cartItemId); 
            res.status(200).json(item);
        } catch (e) {
            return next(e); 
        }
    }

    // --- DELETE /api/cart/:cartItemId (단건 삭제) ---
    removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = this.checkUserId(req, res);
            if (!userId) return;

            const { cartItemId } = req.params;
            if (typeof cartItemId !== 'string') {
                return res.status(400).json({ statusCode: 400, message: "cartItemId가 누락되었습니다.", error: "Bad Request" });
            }

            await this.service.removeCartItem(userId, cartItemId);
            res.status(204).send();
        } catch (e) {
            return next(e); 
        }
    }
}