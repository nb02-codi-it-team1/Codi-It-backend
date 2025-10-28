import { NextFunction, Request, Response } from 'express';
import MetadateService from './metadata.service';

export default class MetadataController {
  private readonly metadataService: MetadateService;

  constructor(metadataService: MetadateService) {
    this.metadataService = metadataService;
  }

  getSizes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sizes = await this.metadataService.getSizes();
      res.status(200).json(sizes);
    } catch (error) {
      return next(error);
    }
  };

  getGrades = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const grades = await this.metadataService.getGrades();
      res.status(200).json(grades);
    } catch (error) {
      return next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.params.name;

      if (!name) {
        return res.status(400).json({ message: '카테고리 이름이 필요합니다.' });
      }

      const categories = await this.metadataService.getCategories(name);
      res.status(200).json(categories);
    } catch (error) {
      return next(error);
    }
  };
}
