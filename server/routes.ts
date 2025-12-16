import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import { storage } from "./storage";
import { hashPassword, comparePassword } from "./auth";
import { 
  insertUserSchema, insertProjectSchema, insertAlertSchema, updateAlertSchema, 
  insertIncidentSchema, updateIncidentSchema, insertCommentSchema, insertCategorySchema
} from "@shared/schema";
import crypto from "crypto";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
    currentProjectId?: string;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || !req.session.currentProjectId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const hasAccess = await storage.isUserInProject(req.session.userId, req.session.currentProjectId);
  if (!hasAccess) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
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
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, displayName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        displayName: displayName || email.split("@")[0],
      });

      req.session.userId = user.id;

      res.status(201).json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        projects: [],
        currentProjectId: null,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to register" });
    }
  });

  // Login by email
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const projects = await storage.getUserProjects(user.id);
      
      req.session.userId = user.id;
      req.session.currentProjectId = projects[0]?.id;

      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role },
        projects,
        currentProjectId: projects[0]?.id,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const projects = await storage.getUserProjects(user.id);

      res.json({
        user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role, language: user.language },
        projects,
        currentProjectId: req.session.currentProjectId,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Switch project
  app.post("/api/auth/switch-project", requireAuth, async (req: Request, res: Response) => {
    try {
      const { projectId } = req.body;
      const hasAccess = await storage.isUserInProject(req.session.userId!, projectId);
      if (!hasAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      req.session.currentProjectId = projectId;
      res.json({ success: true, currentProjectId: projectId });
    } catch (error) {
      res.status(500).json({ error: "Failed to switch project" });
    }
  });

  // Create project
  app.post("/api/projects", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = insertProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid project data" });
      }

      const project = await storage.createProject(parsed.data, req.session.userId!);
      req.session.currentProjectId = project.id;

      await storage.createActivity({
        projectId: project.id,
        userId: req.session.userId,
        action: "project_created",
        details: `Created project "${project.name}"`,
      });

      res.status(201).json(project);
    } catch (error) {
      console.error("Create project error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  // Get current project
  app.get("/api/projects/current", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.session.currentProjectId!);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to get project" });
    }
  });

  // Get project members
  app.get("/api/projects/members", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const members = await storage.getProjectMembers(req.session.currentProjectId!);
      res.json(members);
    } catch (error) {
      res.status(500).json({ error: "Failed to get members" });
    }
  });

  // Get webhook URLs
  app.get("/api/projects/webhooks", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const project = await storage.getProject(req.session.currentProjectId!);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const baseUrl = process.env.EXPO_PUBLIC_DOMAIN || "localhost:5000";
      const protocol = baseUrl.includes("localhost") ? "http" : "https";
      
      res.json({
        alertmanager: `${protocol}://${baseUrl}/api/webhooks/${project.webhookKey}/alertmanager`,
        grafana: `${protocol}://${baseUrl}/api/webhooks/${project.webhookKey}/grafana`,
        zabbix: `${protocol}://${baseUrl}/api/webhooks/${project.webhookKey}/zabbix`,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get webhook URLs" });
    }
  });

  // Invitations
  app.post("/api/invitations", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const invitation = await storage.createInvitation(
        req.session.currentProjectId!,
        email,
        req.session.userId!,
        role
      );

      res.status(201).json(invitation);
    } catch (error) {
      res.status(500).json({ error: "Failed to create invitation" });
    }
  });

  app.get("/api/invitations", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const invitations = await storage.getProjectInvitations(req.session.currentProjectId!);
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get invitations" });
    }
  });

  app.post("/api/invitations/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Token required" });
      }

      const success = await storage.acceptInvitation(token, req.session.userId!);
      if (!success) {
        return res.status(400).json({ error: "Invalid or expired invitation" });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept invitation" });
    }
  });

  // Categories
  app.get("/api/categories", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getCategories(req.session.currentProjectId!);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to get categories" });
    }
  });

  app.post("/api/categories", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const parsed = insertCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid category data" });
      }

      const category = await storage.createCategory(req.session.currentProjectId!, parsed.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const category = await storage.updateCategory(req.params.id, req.body);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Alerts
  app.get("/api/alerts", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const alerts = await storage.getAlerts(req.session.currentProjectId!);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to get alerts" });
    }
  });

  app.get("/api/alerts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }
      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to get alert" });
    }
  });

  app.get("/api/alerts/:id/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getAlertActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get alert history" });
    }
  });

  app.post("/api/alerts", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const parsed = insertAlertSchema.safeParse({
        ...req.body,
        projectId: req.session.currentProjectId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid alert data" });
      }

      const alert = await storage.createAlert({
        ...parsed.data,
        createdById: req.session.userId,
        source: "manual",
      });

      await storage.createActivity({
        projectId: req.session.currentProjectId!,
        userId: req.session.userId,
        alertId: alert.id,
        action: "alert_created",
        details: `Created alert "${alert.title}"`,
      });

      res.status(201).json(alert);
    } catch (error) {
      console.error("Create alert error:", error);
      res.status(500).json({ error: "Failed to create alert" });
    }
  });

  app.put("/api/alerts/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateAlertSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid alert data" });
      }

      const oldAlert = await storage.getAlert(req.params.id);
      const alert = await storage.updateAlert(req.params.id, parsed.data);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      if (parsed.data.status && oldAlert?.status !== parsed.data.status) {
        await storage.createActivity({
          projectId: alert.projectId,
          userId: req.session.userId,
          alertId: alert.id,
          action: "alert_status_changed",
          details: `Changed status from "${oldAlert?.status}" to "${parsed.data.status}"`,
        });
      }

      if (parsed.data.assigneeId !== undefined && oldAlert?.assigneeId !== parsed.data.assigneeId) {
        await storage.createActivity({
          projectId: alert.projectId,
          userId: req.session.userId,
          alertId: alert.id,
          action: "alert_assigned",
          details: parsed.data.assigneeId ? `Assigned to user` : `Unassigned`,
          metadata: { assigneeId: parsed.data.assigneeId },
        });
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to update alert" });
    }
  });

  // Alert comments
  app.get("/api/alerts/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/alerts/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const alert = await storage.getAlert(req.params.id);
      if (!alert) {
        return res.status(404).json({ error: "Alert not found" });
      }

      const comment = await storage.createComment(alert.projectId, req.session.userId!, {
        content: req.body.content,
        alertId: req.params.id,
      });

      await storage.createActivity({
        projectId: alert.projectId,
        userId: req.session.userId,
        alertId: req.params.id,
        action: "comment_added",
        details: `Added comment`,
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Incidents
  app.get("/api/incidents", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const incidents = await storage.getIncidents(req.session.currentProjectId!);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ error: "Failed to get incidents" });
    }
  });

  app.get("/api/incidents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to get incident" });
    }
  });

  app.get("/api/incidents/:id/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getIncidentActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get incident history" });
    }
  });

  app.post("/api/incidents", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const parsed = insertIncidentSchema.safeParse({
        ...req.body,
        projectId: req.session.currentProjectId,
      });
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid incident data" });
      }

      const incident = await storage.createIncident({
        ...parsed.data,
        createdById: req.session.userId,
      });

      if (req.body.alertId) {
        await storage.updateAlert(req.body.alertId, { incidentId: incident.id });
      }

      await storage.createActivity({
        projectId: req.session.currentProjectId!,
        userId: req.session.userId,
        incidentId: incident.id,
        action: "incident_created",
        details: `Created incident "${incident.title}"`,
      });

      res.status(201).json(incident);
    } catch (error) {
      console.error("Create incident error:", error);
      res.status(500).json({ error: "Failed to create incident" });
    }
  });

  app.put("/api/incidents/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const parsed = updateIncidentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid incident data" });
      }

      const oldIncident = await storage.getIncident(req.params.id);
      const incident = await storage.updateIncident(req.params.id, parsed.data);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const changes: string[] = [];
      if (parsed.data.status && oldIncident?.status !== parsed.data.status) {
        changes.push(`status: ${oldIncident?.status} → ${parsed.data.status}`);
      }
      if (changes.length > 0) {
        await storage.createActivity({
          projectId: incident.projectId,
          userId: req.session.userId,
          incidentId: incident.id,
          action: "incident_updated",
          details: `Updated: ${changes.join(", ")}`,
        });
      }

      res.json(incident);
    } catch (error) {
      res.status(500).json({ error: "Failed to update incident" });
    }
  });

  // Incident comments
  app.get("/api/incidents/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const comments = await storage.getComments(undefined, req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get comments" });
    }
  });

  app.post("/api/incidents/:id/comments", requireAuth, async (req: Request, res: Response) => {
    try {
      const incident = await storage.getIncident(req.params.id);
      if (!incident) {
        return res.status(404).json({ error: "Incident not found" });
      }

      const comment = await storage.createComment(incident.projectId, req.session.userId!, {
        content: req.body.content,
        incidentId: req.params.id,
      });

      await storage.createActivity({
        projectId: incident.projectId,
        userId: req.session.userId,
        incidentId: req.params.id,
        action: "comment_added",
        details: `Added comment`,
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Activities
  app.get("/api/activities", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getActivities(req.session.currentProjectId!, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to get activities" });
    }
  });

  // Status
  app.get("/api/status", requireAuth, requireProjectAccess, async (req: Request, res: Response) => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const incidents = await storage.getIncidentsInDateRange(
        req.session.currentProjectId!,
        thirtyDaysAgo,
        now
      );

      const activeIncidents = incidents.filter(i => 
        i.status !== "resolved" && i.status !== "closed"
      );
      
      let currentStatus: "operational" | "degraded" | "outage" = "operational";
      if (activeIncidents.some(i => i.impact === "critical" || i.severity === "critical")) {
        currentStatus = "outage";
      } else if (activeIncidents.length > 0) {
        currentStatus = "degraded";
      }

      const timeline: { date: string; status: string; incidents: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        const dayIncidents = incidents.filter(inc => {
          const incDate = new Date(inc.createdAt).toISOString().split("T")[0];
          return incDate === dateStr;
        });
        
        let dayStatus = "operational";
        if (dayIncidents.some(i => i.impact === "critical" || i.severity === "critical")) {
          dayStatus = "outage";
        } else if (dayIncidents.some(i => i.impact === "major" || i.severity === "high")) {
          dayStatus = "degraded";
        }
        
        timeline.push({
          date: dateStr,
          status: dayStatus,
          incidents: dayIncidents.length,
        });
      }

      res.json({
        currentStatus,
        activeIncidents: activeIncidents.length,
        timeline,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get status" });
    }
  });

  // Webhooks for Alertmanager
  app.post("/api/webhooks/:key/alertmanager", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectByWebhookKey(req.params.key);
      if (!project) {
        return res.status(404).json({ error: "Invalid webhook key" });
      }

      const payload = req.body;
      const alerts = payload.alerts || [];
      
      for (const alertData of alerts) {
        const fingerprint = alertData.fingerprint || crypto.createHash("md5").update(JSON.stringify(alertData.labels)).digest("hex");
        const status = alertData.status === "resolved" ? "resolved" : "new";
        
        const existingAlert = await storage.getAlertByFingerprint(project.id, fingerprint);
        
        if (existingAlert) {
          if (status === "resolved") {
            await storage.updateAlert(existingAlert.id, { status: "resolved" });
            await storage.createActivity({
              projectId: project.id,
              alertId: existingAlert.id,
              action: "alert_resolved_webhook",
              details: "Resolved via Alertmanager",
            });
          }
        } else if (status !== "resolved") {
          const severity = alertData.labels?.severity || "medium";
          const alert = await storage.createAlert({
            projectId: project.id,
            title: alertData.labels?.alertname || alertData.annotations?.summary || "Alert from Alertmanager",
            description: alertData.annotations?.description,
            source: "alertmanager",
            severity: ["critical", "high", "medium", "low"].includes(severity) ? severity : "medium",
            fingerprint,
            externalId: alertData.fingerprint,
            rawPayload: alertData,
          });

          await storage.createActivity({
            projectId: project.id,
            alertId: alert.id,
            action: "alert_received_webhook",
            details: "Received from Alertmanager",
            metadata: { source: "alertmanager" },
          });
        }
      }

      res.json({ success: true, processed: alerts.length });
    } catch (error) {
      console.error("Alertmanager webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Webhooks for Grafana
  app.post("/api/webhooks/:key/grafana", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectByWebhookKey(req.params.key);
      if (!project) {
        return res.status(404).json({ error: "Invalid webhook key" });
      }

      const payload = req.body;
      const alerts = payload.alerts || [payload];
      
      for (const alertData of alerts) {
        const fingerprint = alertData.fingerprint || crypto.createHash("md5").update(JSON.stringify(alertData)).digest("hex");
        const status = alertData.state === "ok" || alertData.status === "resolved" ? "resolved" : "new";
        
        const existingAlert = await storage.getAlertByFingerprint(project.id, fingerprint);
        
        if (existingAlert) {
          if (status === "resolved") {
            await storage.updateAlert(existingAlert.id, { status: "resolved" });
          }
        } else if (status !== "resolved") {
          const alert = await storage.createAlert({
            projectId: project.id,
            title: alertData.title || alertData.ruleName || "Alert from Grafana",
            description: alertData.message,
            source: "grafana",
            severity: "medium",
            fingerprint,
            rawPayload: alertData,
          });

          await storage.createActivity({
            projectId: project.id,
            alertId: alert.id,
            action: "alert_received_webhook",
            details: "Received from Grafana",
          });
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Grafana webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Webhooks for Zabbix
  app.post("/api/webhooks/:key/zabbix", async (req: Request, res: Response) => {
    try {
      const project = await storage.getProjectByWebhookKey(req.params.key);
      if (!project) {
        return res.status(404).json({ error: "Invalid webhook key" });
      }

      const payload = req.body;
      const fingerprint = payload.eventid || crypto.createHash("md5").update(JSON.stringify(payload)).digest("hex");
      const status = payload.status === "OK" || payload.recovery === "1" ? "resolved" : "new";
      
      const existingAlert = await storage.getAlertByFingerprint(project.id, fingerprint);
      
      if (existingAlert) {
        if (status === "resolved") {
          await storage.updateAlert(existingAlert.id, { status: "resolved" });
        }
      } else if (status !== "resolved") {
        const severityMap: Record<string, string> = {
          "0": "low", "1": "low", "2": "medium", "3": "medium", "4": "high", "5": "critical"
        };
        
        const alert = await storage.createAlert({
          projectId: project.id,
          title: payload.name || payload.subject || "Alert from Zabbix",
          description: payload.message,
          source: "zabbix",
          severity: severityMap[payload.severity] || "medium",
          fingerprint,
          externalId: payload.eventid,
          rawPayload: payload,
        });

        await storage.createActivity({
          projectId: project.id,
          alertId: alert.id,
          action: "alert_received_webhook",
          details: "Received from Zabbix",
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Zabbix webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
