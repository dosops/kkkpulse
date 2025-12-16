import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: text("role").default("operator"),
  language: text("language").default("ru"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projectMembers: many(projectMembers),
  assignedAlerts: many(alerts, { relationName: "assignedAlerts" }),
  activities: many(activities),
  comments: many(comments),
}));

// Projects table (formerly organizations)
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  webhookKey: text("webhook_key").notNull().unique(),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  createdBy: one(users, { fields: [projects.createdById], references: [users.id] }),
  members: many(projectMembers),
  alerts: many(alerts),
  incidents: many(incidents),
  categories: many(categories),
  invitations: many(invitations),
  webhookConfigs: many(webhookConfigs),
}));

// Project Members (join table)
export const projectMembers = pgTable("project_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
}));

// Invitations table
export const invitations = pgTable("invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").default("member"),
  invitedById: varchar("invited_by_id").references(() => users.id, { onDelete: "set null" }),
  token: text("token").notNull().unique(),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const invitationsRelations = relations(invitations, ({ one }) => ({
  project: one(projects, { fields: [invitations.projectId], references: [projects.id] }),
  invitedBy: one(users, { fields: [invitations.invitedById], references: [users.id] }),
}));

// Categories table (per project)
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6B7280"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one }) => ({
  project: one(projects, { fields: [categories.projectId], references: [projects.id] }),
}));

// Webhook Configs table
export const webhookConfigs = pgTable("webhook_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const webhookConfigsRelations = relations(webhookConfigs, ({ one }) => ({
  project: one(projects, { fields: [webhookConfigs.projectId], references: [projects.id] }),
}));

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source").default("manual"),
  externalId: text("external_id"),
  fingerprint: text("fingerprint"),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("new"),
  categoryId: varchar("category_id").references(() => categories.id, { onDelete: "set null" }),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const alertsRelations = relations(alerts, ({ one, many }) => ({
  project: one(projects, { fields: [alerts.projectId], references: [projects.id] }),
  category: one(categories, { fields: [alerts.categoryId], references: [categories.id] }),
  assignee: one(users, { fields: [alerts.assigneeId], references: [users.id], relationName: "assignedAlerts" }),
  createdBy: one(users, { fields: [alerts.createdById], references: [users.id] }),
  incident: one(incidents, { fields: [alerts.incidentId], references: [incidents.id] }),
  activities: many(activities),
  comments: many(comments),
}));

// Incidents table
export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  impact: text("impact").default("none"),
  assigneeId: varchar("assignee_id").references(() => users.id, { onDelete: "set null" }),
  createdById: varchar("created_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  startedAt: timestamp("started_at"),
  resolvedAt: timestamp("resolved_at"),
});

export const incidentsRelations = relations(incidents, ({ one, many }) => ({
  project: one(projects, { fields: [incidents.projectId], references: [projects.id] }),
  assignee: one(users, { fields: [incidents.assigneeId], references: [users.id] }),
  createdBy: one(users, { fields: [incidents.createdById], references: [users.id] }),
  alerts: many(alerts),
  activities: many(activities),
  comments: many(comments),
}));

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  alertId: varchar("alert_id").references(() => alerts.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  project: one(projects, { fields: [comments.projectId], references: [projects.id] }),
  alert: one(alerts, { fields: [comments.alertId], references: [alerts.id] }),
  incident: one(incidents, { fields: [comments.incidentId], references: [incidents.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

// Activities table (activity feed / history)
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  alertId: varchar("alert_id").references(() => alerts.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id").references(() => incidents.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  project: one(projects, { fields: [activities.projectId], references: [projects.id] }),
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
  email: true,
  password: true,
  displayName: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  shortName: true,
});

export const insertAlertSchema = createInsertSchema(alerts).pick({
  title: true,
  description: true,
  source: true,
  severity: true,
  projectId: true,
  categoryId: true,
});

export const updateAlertSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["new", "acknowledged", "in_progress", "resolved"]).optional(),
  assigneeId: z.string().nullable().optional(),
  incidentId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  title: true,
  description: true,
  severity: true,
  priority: true,
  projectId: true,
});

export const updateIncidentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(["critical", "high", "medium", "low"]).optional(),
  priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  status: z.enum(["open", "investigating", "identified", "monitoring", "resolved", "closed"]).optional(),
  impact: z.enum(["none", "minor", "major", "critical"]).optional(),
  assigneeId: z.string().nullable().optional(),
});

export const insertCommentSchema = z.object({
  content: z.string().min(1),
  alertId: z.string().optional(),
  incidentId: z.string().optional(),
});

export const insertInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "member", "viewer"]).optional(),
});

export const insertCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectMember = typeof projectMembers.$inferSelect;

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = z.infer<typeof insertInvitationSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type UpdateAlert = z.infer<typeof updateAlertSchema>;

export type Incident = typeof incidents.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type UpdateIncident = z.infer<typeof updateIncidentSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type Activity = typeof activities.$inferSelect;

export type WebhookConfig = typeof webhookConfigs.$inferSelect;
