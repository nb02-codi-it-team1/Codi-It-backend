// import { GetProductsParams } from './dto/product.dto';
// import { productService } from './product.service';
// import { Request, Response, NextFunction } from 'express';

// //  상품등록
// export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const data = req.body;
//     const product = await productService.createProduct(userId, data);
//     res.status(201).json(product);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품목록 조회

// export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const params: GetProductsParams = {
//       page: req.query.page ? Number(req.query.page) : 1,
//       pageSize: req.query.pageSize ? Number(req.query.pageSize) : 16,
//       search: req.query.search?.toString(),
//       sort: req.query.sort?.toString(),
//       priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
//       priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
//       size: req.query.size?.toString(),
//       favoriteStore: req.query.favoriteStore?.toString(),
//       categoryName: req.query.categoryName?.toString(),
//     };

//     const product = await productService.getProducts(params);
//     res.status(200).json(product);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품 수정

// export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
//   console.log('updateProduct 호출됨');
//   console.log('req.params:', req.params);
//   console.log('req.body:', req.body);
//   try {
//     const userId = req.user?.id as string;
//     const productId = req.params.productId!;
//     const updateData = req.body;
//     const updateProduct = await productService.updateProduct(userId, productId, updateData);
//     res.status(200).json(updateProduct);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품 상세조회
// export const getProductDetail = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const productId = req.params.productId!;
//     const productDetail = await productService.getProductDetail(productId);
//     res.status(200).json(productDetail);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품 삭제

// export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const productId = req.params.productId!;
//     const deleteProduct = await productService.deleteProduct(userId, productId);
//     res.status(204).send(deleteProduct);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품 문의 등록

// export const postProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id as string;
//     const productId = req.params.productId!;
//     const data = req.body;
//     const postInquiry = await productService.postProductInquiry(userId, productId, data);
//     res.status(201).json(postInquiry);
//   } catch (error) {
//     next(error);
//   }
// };

// // 상품 문의 조회
// export const getProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const productId = req.params.productId!;
//     const getProductInquiry = await productService.getProductInquiries(productId);
//     res.status(200).json(getProductInquiry);
//   } catch (error) {
//     next(error);
//   }
// };

import { Request, Response, NextFunction } from 'express';
import { GetProductsParams } from './dto/product.dto';
import ProductService from './product.service';
import { BadRequestError } from 'src/common/errors/error-type';

export default class ProductController {
  private readonly productService: ProductService;

  // constructor에서 ProductService 인스턴스를 주입
  constructor(productService: ProductService) {
    this.productService = productService;
  }

  // 상품 등록
  createProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      if (!userId) return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });

      const data = req.body;
      const product = await this.productService.createProduct(userId, data);
      return res.status(201).json(product);
    } catch (error) {
      return next(error);
    }
  };

  // 상품 목록 조회
  getProducts = async (req: Request, res: Response, next: NextFunction) => {
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

      const products = await this.productService.getProducts(params);
      return res.status(200).json(products);
    } catch (error) {
      return next(error);
    }
  };

  // 상품 수정
  updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const productId = req.params.productId;

      if (!productId) throw new BadRequestError('상품 ID가 필요합니다.');
      if (!userId) return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });

      const updateData = req.body;
      const updatedProduct = await this.productService.updateProduct(userId, productId, updateData);
      return res.status(200).json(updatedProduct);
    } catch (error) {
      return next(error);
    }
  };

  // 상품 상세 조회
  getProductDetail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId;
      if (!productId) throw new BadRequestError('상품 ID가 필요합니다.');

      const productDetail = await this.productService.getProductDetail(productId);
      return res.status(200).json(productDetail);
    } catch (error) {
      return next(error);
    }
  };

  // 상품 삭제
  deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const productId = req.params.productId;

      if (!productId) throw new BadRequestError('상품 ID가 필요합니다.');
      if (!userId) return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });

      await this.productService.deleteProduct(userId, productId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  };

  // 상품 문의 등록
  postProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id as string;
      const productId = req.params.productId;

      if (!productId) throw new BadRequestError('상품 ID가 필요합니다.');
      if (!userId) return res.status(401).json({ message: '인증되지 않은 사용자입니다.' });

      const data = req.body;
      const inquiry = await this.productService.postProductInquiry(userId, productId, data);
      return res.status(201).json(inquiry);
    } catch (error) {
      return next(error);
    }
  };

  // 상품 문의 조회
  getProductInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId;
      if (!productId) throw new BadRequestError('상품 ID가 필요합니다.');

      const inquiries = await this.productService.getProductInquiries(productId);
      return res.status(200).json(inquiries);
    } catch (error) {
      return next(error);
    }
  };
}
