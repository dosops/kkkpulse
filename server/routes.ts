import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { hashPassword, comparePassword, authGuard, loadUser, type AuthenticatedRequest } from "./auth";
import { 
  insertUserSchema, insertAlertSchema, updateAlertSchema, 
  insertIncidentSchema, updateIncidentSchema 
} from "@shared/schema";
import { z } from "zod";

const PgSession = connectPgSimple(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "alerthub-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
      },
    })
  );

  // Load user on every request
  app.use(loadUser as any);

  // Auth routes
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const existing = await storage.getUserByUsername(parsed.data.username);
      if (existing) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(parsed.data.password);
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      // Create default organization for new user
      const org = await storage.createOrganization({
        name: `${user.username}'s Organization`,
        shortName: user.username.slice(0, 3).toUpperCase(),
      });
      await storage.addUserToOrganization(user.id, org.id, "admin");

      req.session.userId = user.id;
      req.session.currentOrganizationId = org.id;

      res.status(201).json({
        user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role },
        organization: org,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const orgs = await storage.getUserOrganizations(user.id);
      
      req.session.userId = user.id;
      req.session.currentOrganizationId = orgs[0]?.id;

      res.json({
        user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role },
        organizations: orgs,
        currentOrganizationId: orgs[0]?.id,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const orgs = await storage.getUserOrganizations(user.id);
      
      res.json({
        user: { id: user.id, username: user.username, displayName: user.displayName, email: user.email, role: user.role },
        organizations: orgs,
        currentOrganizationId: req.session.currentOrganizationId,
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Organizations routes
  app.get("/api/organizations", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgs = await storage.getUserOrganizations(req.session.userId!);
      res.json(orgs);
    } catch (error) {
      console.error("Get organizations error:", error);
      res.status(500).json({ error: "Failed to get organizations" });
    }
  });

  app.post("/api/organizations/switch", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { organizationId } = req.body;
      if (!organizationId) {
        return res.status(400).json({ error: "Organization ID required" });
      }

      const hasAccess = await storage.isUserInOrganization(req.session.userId!, organizationId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied to this organization" });
      }

      req.session.currentOrganizationId = organizationId;
      const org = await storage.getOrganization(organizationId);
      
      res.json({ currentOrganization: org });
    } catch (error) {
      console.error("Switch organization error:", error);
      res.status(500).json({ error: "Failed to switch organization" });
    }
  });

  // Alerts routes
  app.get("/api/alerts", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.session.currentOrganizationId;
      if (!orgId) {
        return res.status(400).json({ error: "No organization selected" });
      }

      const alertsList = await storage.getAlerts(orgId);
      res.json(alertsList);
    } catch (error) {
      console.error("Get alerts error:", error);
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.get("/api/alerts/:id", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const hasAccess = await storage.isUserInOrganization(req.session.userId!, alert.organizationId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(alert);
    } catch (error) {
      console.error("Get alert error:", error);
      res.status(500).json({ error: "Failed to get alert" });
    }
  });

  app.post("/api/alerts", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.session.currentOrganizationId;
      if (!orgId) {
        return res.status(400).json({ error: "No organization selected" });
      }

      const parsed = insertAlertSchema.safeParse({ ...req.body, organizationId: orgId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const alert = await storage.createAlert(parsed.data);
      
      await storage.createActivity({
        organizationId: orgId,
        userId: req.session.userId,
        alertId: alert.id,
        action: "alert_created",
        details: `Created alert: ${alert.title}`,
      });

      res.status(201).json(alert);
    } catch (error) {
      console.error("Create alert error:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.patch("/api/alerts/:id", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existingAlert = await storage.getAlert(req.params.id);
      if (!existingAlert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const hasAccess = await storage.isUserInOrganization(req.session.userId!, existingAlert.organizationId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const parsed = updateAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const alert = await storage.updateAlert(req.params.id, parsed.data);
      
      let action = "alert_updated";
      let details = `Updated alert: ${alert?.title}`;
      
      if (parsed.data.status === "in_progress" && existingAlert.status !== "in_progress") {
        action = "alert_taken";
        details = `Took alert to work: ${alert?.title}`;
      } else if (parsed.data.status === "resolved" && existingAlert.status !== "resolved") {
        action = "alert_resolved";
        details = `Resolved alert: ${alert?.title}`;
      } else if (parsed.data.assigneeId && parsed.data.assigneeId !== existingAlert.assigneeId) {
        action = "alert_assigned";
        details = `Assigned alert: ${alert?.title}`;
      }

      await storage.createActivity({
        organizationId: existingAlert.organizationId,
        userId: req.session.userId,
        alertId: alert?.id,
        action,
        details,
      });

      res.json(alert);
    } catch (error) {
      console.error("Update alert error:", error);
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Incidents routes
  app.get("/api/incidents", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.session.currentOrganizationId;
      if (!orgId) {
        return res.status(400).json({ error: "No organization selected" });
      }

      const incidentsList = await storage.getIncidents(orgId);
      res.json(incidentsList);
    } catch (error) {
      console.error("Get incidents error:", error);
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  app.get("/api/incidents/:id", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const hasAccess = await storage.isUserInOrganization(req.session.userId!, incident.organizationId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(incident);
    } catch (error) {
      console.error("Get incident error:", error);
      res.status(500).json({ error: "Failed to get incident" });
    }
  });

  app.post("/api/incidents", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.session.currentOrganizationId;
      if (!orgId) {
        return res.status(400).json({ error: "No organization selected" });
      }

      const parsed = insertIncidentSchema.safeParse({ ...req.body, organizationId: orgId });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const incident = await storage.createIncident({
        ...parsed.data,
        createdById: req.session.userId,
      } as any);

      // If alertId provided, link alert to incident
      if (req.body.alertId) {
        await storage.updateAlert(req.body.alertId, { incidentId: incident.id });
      }
      
      await storage.createActivity({
        organizationId: orgId,
        userId: req.session.userId,
        incidentId: incident.id,
        action: "incident_created",
        details: `Created incident: ${incident.title}`,
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error("Create incident error:", error);
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  app.patch("/api/incidents/:id", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const existingIncident = await storage.getIncident(req.params.id);
      if (!existingIncident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const hasAccess = await storage.isUserInOrganization(req.session.userId!, existingIncident.organizationId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }

      const parsed = updateIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
      }

      const incident = await storage.updateIncident(req.params.id, parsed.data);
      
      let action = "incident_updated";
      let details = `Updated incident: ${incident?.title}`;
      
      if (parsed.data.status === "resolved" && existingIncident.status !== "resolved") {
        action = "incident_resolved";
        details = `Resolved incident: ${incident?.title}`;
      }

      await storage.createActivity({
        organizationId: existingIncident.organizationId,
        userId: req.session.userId,
        incidentId: incident?.id,
        action,
        details,
      });

      res.json(incident);
    } catch (error) {
      console.error("Update incident error:", error);
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  // Activity routes
  app.get("/api/activities", authGuard as any, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const orgId = req.session.currentOrganizationId;
      if (!orgId) {
        return res.status(400).json({ error: "No organization selected" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const activitiesList = await storage.getActivities(orgId, limit);
      res.json(activitiesList);
    } catch (error) {
      console.error("Get activities error:", error);
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
