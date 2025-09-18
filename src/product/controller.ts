import { GetProductsParams } from './dto/create-product.dto';
import { productService } from './service';
import { Request, Response, NextFunction } from 'express';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const product = await productService.createProduct(userId, data);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

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

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.id;
    const productId = req.params.productId!;
    const updateData = req.body;

    const updateProduct = await productService.updateProduct(userId, productId, updateData);
    res.status(200).json(updateProduct);
  } catch (error) {
    next(error);
  }
};

export const getProductDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId!;
    const productDetail = await productService.getProductDetail(productId);
    res.status(200).json(productDetail);
  } catch (error) {
    next(error);
  }
};
