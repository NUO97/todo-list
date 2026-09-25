import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Db } from '../db';

const SALT_ROUNDS = 10;

export interface User {
  id: string;
  email: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email is already registered');
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password');
  }
}

export function createAuthService(db: Db, jwtSecret: string) {
  const findByEmail = (email: string): UserRow | undefined =>
    db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  const toUser = (row: UserRow): User => ({ id: row.id, email: row.email });

  const issueToken = (userId: string): string =>
    jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });

  return {
    async register(email: string, password: string): Promise<AuthResult> {
      if (findByEmail(email)) {
        throw new EmailAlreadyRegisteredError();
      }
      const id = randomUUID();
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      db.prepare(
        'INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      ).run(id, email, passwordHash, new Date().toISOString());

      return { token: issueToken(id), user: { id, email } };
    },

    async login(email: string, password: string): Promise<AuthResult> {
      const row = findByEmail(email);
      if (!row) {
        throw new InvalidCredentialsError();
      }
      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid) {
        throw new InvalidCredentialsError();
      }
      return { token: issueToken(row.id), user: toUser(row) };
    },

    verifyToken(token: string): string | null {
      try {
        const payload = jwt.verify(token, jwtSecret);
        if (typeof payload === 'object' && typeof payload.sub === 'string') {
          return payload.sub;
        }
        return null;
      } catch {
        return null;
      }
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
