import { 
  users, projects, projectMembers, alerts, incidents, activities, comments, categories, invitations, webhookConfigs,
  type User, type InsertUser, 
  type Project, type InsertProject,
  type ProjectMember,
  type Alert, type InsertAlert, type UpdateAlert,
  type Incident, type InsertIncident, type UpdateIncident,
  type Activity,
  type Comment, type InsertComment,
  type Category, type InsertCategory,
  type Invitation,
  type WebhookConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, or, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function generateWebhookKey(): string {
  return randomBytes(16).toString("hex");
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectByWebhookKey(webhookKey: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  createProject(project: InsertProject, userId: string): Promise<Project>;
  addUserToProject(userId: string, projectId: string, role?: string): Promise<ProjectMember>;
  isUserInProject(userId: string, projectId: string): Promise<boolean>;
  getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]>;
  
  // Invitations
  createInvitation(projectId: string, email: string, invitedById: string, role?: string): Promise<Invitation>;
  getInvitationByToken(token: string): Promise<Invitation | undefined>;
  getProjectInvitations(projectId: string): Promise<Invitation[]>;
  acceptInvitation(token: string, userId: string): Promise<boolean>;
  
  // Categories
  getCategories(projectId: string): Promise<Category[]>;
  createCategory(projectId: string, data: InsertCategory): Promise<Category>;
  updateCategory(id: string, data: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  createDefaultCategories(projectId: string): Promise<void>;
  
  // Alerts
  getAlerts(projectId: string): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  getAlertByFingerprint(projectId: string, fingerprint: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert & { createdById?: string; fingerprint?: string; externalId?: string; rawPayload?: any }): Promise<Alert>;
  updateAlert(id: string, data: UpdateAlert): Promise<Alert | undefined>;
  
  // Incidents
  getIncidents(projectId: string): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  getIncidentsInDateRange(projectId: string, startDate: Date, endDate: Date): Promise<Incident[]>;
  createIncident(incident: InsertIncident & { createdById?: string }): Promise<Incident>;
  updateIncident(id: string, data: UpdateIncident): Promise<Incident | undefined>;
  
  // Comments
  getComments(alertId?: string, incidentId?: string): Promise<(Comment & { user: User })[]>;
  createComment(projectId: string, userId: string, data: InsertComment): Promise<Comment>;
  
  // Activities
  getActivities(projectId: string, limit?: number): Promise<(Activity & { user?: User })[]>;
  getAlertActivities(alertId: string): Promise<(Activity & { user?: User })[]>;
  getIncidentActivities(incidentId: string): Promise<(Activity & { user?: User })[]>;
  createActivity(activity: { 
    projectId: string; 
    userId?: string; 
    alertId?: string; 
    incidentId?: string; 
    action: string; 
    details?: string;
    metadata?: any;
  }): Promise<Activity>;
  
  // Webhook configs
  getWebhookConfigs(projectId: string): Promise<WebhookConfig[]>;
  createWebhookConfig(projectId: string, source: string): Promise<WebhookConfig>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values({
      ...insertUser,
      email: insertUser.email.toLowerCase(),
    }).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectByWebhookKey(webhookKey: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.webhookKey, webhookKey));
    return project || undefined;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    const result = await db
      .select({ project: projects })
      .from(projectMembers)
      .innerJoin(projects, eq(projectMembers.projectId, projects.id))
      .where(eq(projectMembers.userId, userId));
    return result.map(r => r.project);
  }

  async createProject(project: InsertProject, userId: string): Promise<Project> {
    const webhookKey = generateWebhookKey();
    const [created] = await db.insert(projects).values({
      ...project,
      webhookKey,
      createdById: userId,
    }).returning();
    
    await this.addUserToProject(userId, created.id, "admin");
    await this.createDefaultCategories(created.id);
    
    return created;
  }

  async addUserToProject(userId: string, projectId: string, role: string = "member"): Promise<ProjectMember> {
    const [member] = await db.insert(projectMembers).values({
      userId,
      projectId,
      role,
    }).returning();
    return member;
  }

  async isUserInProject(userId: string, projectId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(projectMembers)
      .where(and(
        eq(projectMembers.userId, userId),
        eq(projectMembers.projectId, projectId)
      ));
    return !!member;
  }

  async getProjectMembers(projectId: string): Promise<(ProjectMember & { user: User })[]> {
    const result = await db
      .select()
      .from(projectMembers)
      .innerJoin(users, eq(projectMembers.userId, users.id))
      .where(eq(projectMembers.projectId, projectId));
    return result.map(r => ({ ...r.project_members, user: r.users }));
  }

  // Invitations
  async createInvitation(projectId: string, email: string, invitedById: string, role: string = "member"): Promise<Invitation> {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const [invitation] = await db.insert(invitations).values({
      projectId,
      email: email.toLowerCase(),
      invitedById,
      token,
      role,
      expiresAt,
    }).returning();
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<Invitation | undefined> {
    const [invitation] = await db.select().from(invitations).where(eq(invitations.token, token));
    return invitation || undefined;
  }

  async getProjectInvitations(projectId: string): Promise<Invitation[]> {
    return db.select().from(invitations).where(eq(invitations.projectId, projectId));
  }

  async acceptInvitation(token: string, userId: string): Promise<boolean> {
    const invitation = await this.getInvitationByToken(token);
    if (!invitation || invitation.status !== "pending" || new Date() > invitation.expiresAt) {
      return false;
    }
    
    await this.addUserToProject(userId, invitation.projectId, invitation.role || "member");
    await db.update(invitations).set({ status: "accepted" }).where(eq(invitations.id, invitation.id));
    return true;
  }

  // Categories
  async getCategories(projectId: string): Promise<Category[]> {
    return db.select().from(categories).where(eq(categories.projectId, projectId));
  }

  async createCategory(projectId: string, data: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values({
      projectId,
      ...data,
    }).returning();
    return category;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category | undefined> {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    return category || undefined;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return true;
  }

  async createDefaultCategories(projectId: string): Promise<void> {
    const defaults = [
      { name: "Infrastructure", color: "#3B82F6", isDefault: true },
      { name: "Database", color: "#8B5CF6", isDefault: true },
      { name: "Network", color: "#06B6D4", isDefault: true },
      { name: "Security", color: "#EF4444", isDefault: true },
      { name: "Application", color: "#10B981", isDefault: true },
      { name: "Performance", color: "#F59E0B", isDefault: true },
    ];
    
    for (const cat of defaults) {
      await db.insert(categories).values({ projectId, ...cat });
    }
  }

  // Alerts
  async getAlerts(projectId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.projectId, projectId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async getAlertByFingerprint(projectId: string, fingerprint: string): Promise<Alert | undefined> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(and(
        eq(alerts.projectId, projectId),
        eq(alerts.fingerprint, fingerprint)
      ));
    return alert || undefined;
  }

  async createAlert(insertAlert: InsertAlert & { createdById?: string; fingerprint?: string; externalId?: string; rawPayload?: any }): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async updateAlert(id: string, data: UpdateAlert): Promise<Alert | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    const [alert] = await db
      .update(alerts)
      .set(updateData)
      .where(eq(alerts.id, id))
      .returning();
    return alert || undefined;
  }

  // Incidents
  async getIncidents(projectId: string): Promise<Incident[]> {
    return db
      .select()
      .from(incidents)
      .where(eq(incidents.projectId, projectId))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async getIncidentsInDateRange(projectId: string, startDate: Date, endDate: Date): Promise<Incident[]> {
    return db
      .select()
      .from(incidents)
      .where(and(
        eq(incidents.projectId, projectId),
        gte(incidents.createdAt, startDate),
        lte(incidents.createdAt, endDate)
      ))
      .orderBy(desc(incidents.createdAt));
  }

  async createIncident(insertIncident: InsertIncident & { createdById?: string }): Promise<Incident> {
    const [incident] = await db.insert(incidents).values({
      ...insertIncident,
      startedAt: new Date(),
    }).returning();
    return incident;
  }

  async updateIncident(id: string, data: UpdateIncident): Promise<Incident | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === "resolved" || data.status === "closed") {
      updateData.resolvedAt = new Date();
    }
    const [incident] = await db
      .update(incidents)
      .set(updateData)
      .where(eq(incidents.id, id))
      .returning();
    return incident || undefined;
  }

  // Comments
  async getComments(alertId?: string, incidentId?: string): Promise<(Comment & { user: User })[]> {
    let query = db
      .select()
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id));
    
    if (alertId) {
      query = query.where(eq(comments.alertId, alertId)) as any;
    } else if (incidentId) {
      query = query.where(eq(comments.incidentId, incidentId)) as any;
    }
    
    const result = await query.orderBy(desc(comments.createdAt));
    return result.map(r => ({ ...r.comments, user: r.users }));
  }

  async createComment(projectId: string, userId: string, data: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values({
      projectId,
      userId,
      content: data.content,
      alertId: data.alertId,
      incidentId: data.incidentId,
    }).returning();
    return comment;
  }

  // Activities
  async getActivities(projectId: string, limit: number = 50): Promise<(Activity & { user?: User })[]> {
    const result = await db
      .select()
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.projectId, projectId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
    return result.map(r => ({ ...r.activities, user: r.users || undefined }));
  }

  async getAlertActivities(alertId: string): Promise<(Activity & { user?: User })[]> {
    const result = await db
      .select()
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.alertId, alertId))
      .orderBy(desc(activities.createdAt));
    return result.map(r => ({ ...r.activities, user: r.users || undefined }));
  }

  async getIncidentActivities(incidentId: string): Promise<(Activity & { user?: User })[]> {
    const result = await db
      .select()
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .where(eq(activities.incidentId, incidentId))
      .orderBy(desc(activities.createdAt));
    return result.map(r => ({ ...r.activities, user: r.users || undefined }));
  }

  async createActivity(activity: { 
    projectId: string; 
    userId?: string; 
    alertId?: string; 
    incidentId?: string; 
    action: string; 
    details?: string;
    metadata?: any;
  }): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  // Webhook configs
  async getWebhookConfigs(projectId: string): Promise<WebhookConfig[]> {
    return db.select().from(webhookConfigs).where(eq(webhookConfigs.projectId, projectId));
  }

  async createWebhookConfig(projectId: string, source: string): Promise<WebhookConfig> {
    const [config] = await db.insert(webhookConfigs).values({ projectId, source }).returning();
    return config;
  }
}

export const storage = new DatabaseStorage();
