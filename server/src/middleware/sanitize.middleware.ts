import { Request, Response, NextFunction } from 'express';

const cleanInput = (obj: any): any => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        if (key.startsWith('$')) {
          delete obj[key];
        } else {
          cleanInput(obj[key]);
        }
      }
    }
  }
  return obj;
};

export const sanitizeMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  req.body = cleanInput(req.body);
  req.query = cleanInput(req.query);
  req.params = cleanInput(req.params);
  next();
};
