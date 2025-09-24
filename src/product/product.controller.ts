import { GetProductsParams } from './dto/product.dto';
import { productService } from './product.service';
import { Request, Response, NextFunction } from 'express';

//  상품등록
export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const data = req.body;
    const product = await productService.createProduct(userId, data);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// 상품목록 조회

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params: GetProductsParams = {
      page: req.query.page ? Number(req.query.page) : 1,
      pageSize: req.query.pageSize ? Number(req.query.pageSize) : 16,
      search: req.query.search?.toString(),
      sort: req.query.sort?.toString(),
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      size: req.query.size?.toString(),
      favoriteStore: req.query.favoriteStore?.toString(),
      categoryName: req.query.categoryName?.toString(),
    };

    const product = await productService.getProducts(params);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

// 상품 수정

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const productId = req.params.productId!;
    const updateData = req.body;
    if (productId !== req.body.id) {
      res.status(400).json({ message: 'URL과 body의 상품 ID가 일치하지 않습니다.' });
    }

    const updateProduct = await productService.updateProduct(userId, productId, updateData);
    res.status(200).json(updateProduct);
  } catch (error) {
    next(error);
  }
};

// 상품 상세조회
export const getProductDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId!;
    const productDetail = await productService.getProductDetail(productId);
    res.status(200).json(productDetail);
  } catch (error) {
    next(error);
  }
};

// 상품 삭제

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const productId = req.params.productId!;
    const deleteProduct = await productService.deleteProduct(userId, productId);
    res.status(204).send(deleteProduct);
  } catch (error) {
    next(error);
  }
};

// 상품 문의 등록

export const postProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id as string;
    const productId = req.params.productId!;
    const data = req.body;
    const postInquiry = await productService.postProductInquiry(userId, productId, data);
    res.status(201).json(postInquiry);
  } catch (error) {
    next(error);
  }
};

// 상품 문의 조회
export const getProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId!;
    const getProductInquiry = await productService.getProductInquiries(productId);
    res.status(200).json(getProductInquiry);
  } catch (error) {
    next(error);
  }
};
