import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  email: text("email"),
  role: text("role").default("operator"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  organizationMembers: many(organizationMembers),
  assignedAlerts: many(alerts, { relationName: "assignedAlerts" }),
  activities: many(activities),
}));

// Organizations table
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  alerts: many(alerts),
  incidents: many(incidents),
}));

// Organization Members (join table)
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  user: one(users, { fields: [organizationMembers.userId], references: [users.id] }),
  organization: one(organizations, { fields: [organizationMembers.organizationId], references: [organizations.id] }),
}));

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").default("manual"),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("new"),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  organization: one(organizations, { fields: [alerts.organizationId], references: [organizations.id] }),
  assignee: one(users, { fields: [alerts.assigneeId], references: [users.id], relationName: "assignedAlerts" }),
  incident: one(incidents, { fields: [alerts.incidentId], references: [incidents.id] }),
  activities: many(activities),
}));

// Incidents table
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  organization: one(organizations, { fields: [incidents.organizationId], references: [organizations.id] }),
  createdBy: one(users, { fields: [incidents.createdById], references: [users.id] }),
  alerts: many(alerts),
  activities: many(activities),
}));

// Activities table (activity feed)
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  alertId: varchar("alert_id").references(() => alerts.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, { fields: [activities.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [activities.userId], references: [users.id] }),
  alert: one(alerts, { fields: [activities.alertId], references: [alerts.id] }),
  incident: one(incidents, { fields: [activities.incidentId], references: [incidents.id] }),
}));

// Sessions table for express-session
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  email: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  shortName: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  title: true,
  description: true,
  source: true,
  severity: true,
  organizationId: true,
});

export const updateAlertSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["new", "in_progress", "resolved"]).optional(),
  assigneeId: z.string().nullable().optional(),
  incidentId: z.string().nullable().optional(),
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  title: true,
  description: true,
  severity: true,
  priority: true,
  organizationId: true,
});

export const updateIncidentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["open", "investigating", "resolved", "closed"]).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type OrganizationMember = typeof organizationMembers.$inferSelect;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type UpdateAlert = z.infer<typeof updateAlertSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type UpdateIncident = z.infer<typeof updateIncidentSchema>;

export type Activity = typeof activities.$inferSelect;
