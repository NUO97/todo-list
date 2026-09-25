import { apiRequest } from './client';
import type { User } from './types';

export interface AuthResult {
  token: string;
  user: User;
}

export const register = (email: string, password: string): Promise<AuthResult> =>
  apiRequest<AuthResult>('/auth/register', { method: 'POST', body: { email, password } });

export const login = (email: string, password: string): Promise<AuthResult> =>
  apiRequest<AuthResult>('/auth/login', { method: 'POST', body: { email, password } });
