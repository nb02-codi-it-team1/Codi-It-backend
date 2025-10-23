import { NextFunction, Request, Response } from 'express';
import DashboardService from './dashboard.service';

export default class DashboardController {
  private readonly dashboardService: DashboardService;

  constructor(dashboardService: DashboardService) {
    this.dashboardService = dashboardService;
  }

  getDashboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storeId = req.storeId;

      if (!storeId) {
        return res.status(403).json({ message: 'Store ID가 필요합니다.' });
      }

      const dashboard = await this.dashboardService.getDashboardSummary(storeId, 5);

      return res.status(200).json(dashboard);
    } catch (error) {
      return next(error);
    }
  };
}
