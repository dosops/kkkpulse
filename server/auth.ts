import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import type { User } from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    currentOrganizationId?: string;
  }
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function authGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function loadUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.session.userId) {
    const user = await storage.getUser(req.session.userId);
    if (user) {
      req.user = user;
    }
  }
  next();
}

export async function requireOrganizationAccess(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  const orgId = req.params.orgId || req.body.organizationId || req.session.currentOrganizationId;
  
  if (!orgId) {
    return res.status(400).json({ error: "Organization ID required" });
  }
  
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const hasAccess = await storage.isUserInOrganization(req.session.userId, orgId);
  if (!hasAccess) {
    return res.status(403).json({ error: "Access denied to this organization" });
  }
  
  next();
}
