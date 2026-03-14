import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "./db.js";
import { users } from "./schema.js";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CLIENT" | "EMPLOYEE";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "fallback-secret";

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export function generateJWT(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, {
    expiresIn: "24h",
  });
}

export function verifyJWT(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    const user = verifyJWT(auth.slice(7));
    if (user) {
      req.user = user;
      return next();
    }
  }
  return res.status(401).json({ message: "Authentication required" });
}

export function requireEmployee(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ message: "Authentication required" });
  if (req.user.role !== "EMPLOYEE" && req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Employee access required" });
  }
  return next();
}
