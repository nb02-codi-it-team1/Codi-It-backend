// src/metadata/metadata.controller.ts
import { Request, Response } from 'express';
import MetadataService, { CategoryFilter } from './metadata.service';

export default class MetadataController {
  constructor(private readonly service: MetadataService) {}

  getGradeList = async (_req: Request, res: Response) => {
    const rows = await this.service.getGrades();
    res.json(rows); // [{ id, name, rate, minAmount }]
  };

  getSizeList = async (_req: Request, res: Response) => {
    const rows = await this.service.getSizes();
    res.json(rows); // [{ id, name, size: { ko, en } }]
  };

  getCategoryList = async (req: Request, res: Response) => {
    const name = (req.params.name ?? 'all') as CategoryFilter;
    const rows = await this.service.getCategories(name);
    res.json(rows); // [{ id, name }]
  };
}
