import { 
  users, organizations, organizationMembers, alerts, incidents, activities,
  type User, type InsertUser, 
  type Organization, type InsertOrganization,
  type OrganizationMember,
  type Alert, type InsertAlert, type UpdateAlert,
  type Incident, type InsertIncident, type UpdateIncident,
  type Activity
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Organizations
  getOrganization(id: string): Promise<Organization | undefined>;
  getUserOrganizations(userId: string): Promise<Organization[]>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  addUserToOrganization(userId: string, orgId: string, role?: string): Promise<OrganizationMember>;
  isUserInOrganization(userId: string, orgId: string): Promise<boolean>;
  
  // Alerts
  getAlerts(organizationId: string): Promise<Alert[]>;
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  updateAlert(id: string, data: UpdateAlert): Promise<Alert | undefined>;
  
  // Incidents
  getIncidents(organizationId: string): Promise<Incident[]>;
  getIncident(id: string): Promise<Incident | undefined>;
  createIncident(incident: InsertIncident): Promise<Incident>;
  updateIncident(id: string, data: UpdateIncident): Promise<Incident | undefined>;
  
  // Activities
  getActivities(organizationId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: { 
    organizationId: string; 
    userId?: string; 
    alertId?: string; 
    incidentId?: string; 
    action: string; 
    details?: string; 
  }): Promise<Activity>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Organizations
  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    const result = await db
      .select({ organization: organizations })
      .from(organizationMembers)
      .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
      .where(eq(organizationMembers.userId, userId));
    return result.map(r => r.organization);
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [created] = await db.insert(organizations).values(org).returning();
    return created;
  }

  async addUserToOrganization(userId: string, orgId: string, role: string = "member"): Promise<OrganizationMember> {
    const [member] = await db.insert(organizationMembers).values({
      userId,
      organizationId: orgId,
      role,
    }).returning();
    return member;
  }

  async isUserInOrganization(userId: string, orgId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(organizationMembers)
      .where(and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, orgId)
      ));
    return !!member;
  }

  // Alerts
  async getAlerts(organizationId: string): Promise<Alert[]> {
    return db
      .select()
      .from(alerts)
      .where(eq(alerts.organizationId, organizationId))
      .orderBy(desc(alerts.createdAt));
  }

  async getAlert(id: string): Promise<Alert | undefined> {
    const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
    return alert || undefined;
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const [alert] = await db.insert(alerts).values(insertAlert).returning();
    return alert;
  }

  async updateAlert(id: string, data: UpdateAlert): Promise<Alert | undefined> {
    const [alert] = await db
      .update(alerts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(alerts.id, id))
      .returning();
    return alert || undefined;
  }

  // Incidents
  async getIncidents(organizationId: string): Promise<Incident[]> {
    return db
      .select()
      .from(incidents)
      .where(eq(incidents.organizationId, organizationId))
      .orderBy(desc(incidents.createdAt));
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident || undefined;
  }

  async createIncident(insertIncident: InsertIncident): Promise<Incident> {
    const [incident] = await db.insert(incidents).values(insertIncident).returning();
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

  // Activities
  async getActivities(organizationId: string, limit: number = 50): Promise<Activity[]> {
    return db
      .select()
      .from(activities)
      .where(eq(activities.organizationId, organizationId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: { 
    organizationId: string; 
    userId?: string; 
    alertId?: string; 
    incidentId?: string; 
    action: string; 
    details?: string; 
  }): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
