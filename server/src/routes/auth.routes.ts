import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { validateBody } from '../middleware/validate';
import { loginSchema, registerSchema } from '../schemas/auth.schema';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  type AuthService,
} from '../services/auth.service';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  router.post(
    '/register',
    validateBody(registerSchema),
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      try {
        const result = await authService.register(email, password);
        res.status(201).json(result);
      } catch (err) {
        if (err instanceof EmailAlreadyRegisteredError) {
          res.status(400).json({ error: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  router.post(
    '/login',
    validateBody(loginSchema),
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      try {
        const result = await authService.login(email, password);
        res.status(200).json(result);
      } catch (err) {
        if (err instanceof InvalidCredentialsError) {
          res.status(401).json({ error: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  return router;
}
