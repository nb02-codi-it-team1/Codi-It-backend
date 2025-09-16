import { Request } from 'express';

export const getIp = (req: Request): string => req.ip || 'unknown';
export const getUrl = (req: Request): string => req.baseUrl || 'unknown';
export const getMethod = (req: Request): string => req.method || 'unknown';
