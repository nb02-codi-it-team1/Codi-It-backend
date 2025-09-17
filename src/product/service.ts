import { BadRequestError } from 'src/common/errors/error-type';
import { productRepository } from './repository';
import { CreateProductDto } from './dto/create-product.dto';

export const productService = {
  async createProduct(userId: number, body: CreateProductDto) {
    const {
      name,
      price,
      content,
      image,
      discountRate,
      discountStartTime,
      discountEndTime,
      categoryName,
      stocks,
    } = body;
    if(!name || !price || !categoryName || !stocks){
      throw BadRequestError
    }
    return productRepository.create


  },
};
