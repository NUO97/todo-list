import type { NextFunction, Request, Response } from 'express';
import type { AuthService } from '../services/auth.service';

export function requireAuth(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userId = authService.verifyToken(token);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.locals.userId = userId;
    next();
  };
}
