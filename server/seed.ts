import { db } from "./db";
import { users, projects, projectMembers, alerts, incidents, activities, categories, comments } from "@shared/schema";
import { hashPassword } from "./auth";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create users
  const password = await hashPassword("password123");
  
  const [admin] = await db.insert(users).values({
    email: "admin@alerthub.com",
    password,
    displayName: "Admin User",
    role: "admin",
  }).returning();
  console.log("Created admin user:", admin.email);

  const [operator1] = await db.insert(users).values({
    email: "operator@alerthub.com",
    password,
    displayName: "Alex Operator",
    role: "operator",
  }).returning();
  console.log("Created operator user:", operator1.email);

  const [operator2] = await db.insert(users).values({
    email: "maria@alerthub.com",
    password,
    displayName: "Maria Engineer",
    role: "operator",
  }).returning();
  console.log("Created operator user:", operator2.email);

  const [viewer] = await db.insert(users).values({
    email: "viewer@alerthub.com",
    password,
    displayName: "View Only User",
    role: "viewer",
  }).returning();
  console.log("Created viewer user:", viewer.email);

  // Users without projects (for testing fresh onboarding)
  const [newUser1] = await db.insert(users).values({
    email: "new1@example.com",
    password,
    displayName: "New User One",
    role: "operator",
  }).returning();
  console.log("Created new user (no project):", newUser1.email);

  const [newUser2] = await db.insert(users).values({
    email: "new2@example.com",
    password,
    displayName: "New User Two",
    role: "operator",
  }).returning();
  console.log("Created new user (no project):", newUser2.email);

  // Create project 1 (Demo Project - with data)
  const [project1] = await db.insert(projects).values({
    name: "Demo Infrastructure",
    shortName: "DEMO",
    webhookKey: randomBytes(16).toString("hex"),
    createdById: admin.id,
  }).returning();
  console.log("Created project:", project1.name);

  // Add members to project 1
  await db.insert(projectMembers).values([
    { userId: admin.id, projectId: project1.id, role: "admin" },
    { userId: operator1.id, projectId: project1.id, role: "member" },
    { userId: operator2.id, projectId: project1.id, role: "member" },
    { userId: viewer.id, projectId: project1.id, role: "viewer" },
  ]);
  console.log("Added members to project 1");

  // Create default categories for project 1
  const [catInfra] = await db.insert(categories).values({
    projectId: project1.id,
    name: "Infrastructure",
    color: "#3B82F6",
    isDefault: true,
  }).returning();
  
  const [catDB] = await db.insert(categories).values({
    projectId: project1.id,
    name: "Database",
    color: "#8B5CF6",
    isDefault: true,
  }).returning();

  const [catNetwork] = await db.insert(categories).values({
    projectId: project1.id,
    name: "Network",
    color: "#06B6D4",
    isDefault: true,
  }).returning();

  const [catSecurity] = await db.insert(categories).values({
    projectId: project1.id,
    name: "Security",
    color: "#EF4444",
    isDefault: true,
  }).returning();

  await db.insert(categories).values({
    projectId: project1.id,
    name: "Application",
    color: "#10B981",
    isDefault: true,
  });

  await db.insert(categories).values({
    projectId: project1.id,
    name: "Performance",
    color: "#F59E0B",
    isDefault: true,
  });
  console.log("Created categories for project 1");

  // Create alerts for project 1
  const [alert1] = await db.insert(alerts).values({
    projectId: project1.id,
    title: "High CPU Usage on prod-server-01",
    description: "CPU usage has exceeded 90% for the past 15 minutes. This may indicate a runaway process or increased load.",
    source: "alertmanager",
    severity: "critical",
    status: "new",
    categoryId: catInfra.id,
    createdById: admin.id,
    fingerprint: "cpu-prod-server-01",
  }).returning();

  const [alert2] = await db.insert(alerts).values({
    projectId: project1.id,
    title: "Database Connection Pool Exhausted",
    description: "PostgreSQL connection pool has reached maximum capacity. New connections are being rejected.",
    source: "grafana",
    severity: "high",
    status: "acknowledged",
    categoryId: catDB.id,
    assigneeId: operator1.id,
    createdById: operator1.id,
    fingerprint: "db-pool-exhausted",
  }).returning();

  const [alert3] = await db.insert(alerts).values({
    projectId: project1.id,
    title: "SSL Certificate Expiring Soon",
    description: "SSL certificate for api.example.com will expire in 7 days.",
    source: "zabbix",
    severity: "medium",
    status: "in_progress",
    categoryId: catSecurity.id,
    assigneeId: operator2.id,
    createdById: operator2.id,
    fingerprint: "ssl-cert-api",
  }).returning();

  await db.insert(alerts).values({
    projectId: project1.id,
    title: "Network Latency Spike Detected",
    description: "Latency between datacenter zones has increased by 300%.",
    source: "alertmanager",
    severity: "high",
    status: "new",
    categoryId: catNetwork.id,
    createdById: admin.id,
    fingerprint: "network-latency-dc",
  });

  await db.insert(alerts).values({
    projectId: project1.id,
    title: "Memory Usage Warning",
    description: "Memory usage on app-server-03 is at 85%.",
    source: "zabbix",
    severity: "medium",
    status: "resolved",
    categoryId: catInfra.id,
    assigneeId: operator1.id,
    createdById: admin.id,
    fingerprint: "memory-app-03",
    resolvedAt: new Date(),
  });

  await db.insert(alerts).values({
    projectId: project1.id,
    title: "Disk Space Low on Backup Server",
    description: "Available disk space is below 10% on backup-server-01.",
    source: "manual",
    severity: "low",
    status: "new",
    categoryId: catInfra.id,
    createdById: operator2.id,
  });
  console.log("Created alerts for project 1");

  // Create incidents for project 1
  const [incident1] = await db.insert(incidents).values({
    projectId: project1.id,
    title: "Major Outage - API Gateway Failure",
    description: "The main API gateway is experiencing intermittent failures causing service disruption for all customers.",
    severity: "critical",
    priority: "critical",
    status: "investigating",
    impact: "critical",
    assigneeId: admin.id,
    createdById: admin.id,
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  }).returning();

  await db.insert(incidents).values({
    projectId: project1.id,
    title: "Degraded Database Performance",
    description: "Query response times have increased by 200%, causing slow page loads.",
    severity: "high",
    priority: "high",
    status: "identified",
    impact: "major",
    assigneeId: operator1.id,
    createdById: operator1.id,
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  });

  await db.insert(incidents).values({
    projectId: project1.id,
    title: "Scheduled Maintenance Window",
    description: "Planned maintenance for database server upgrade.",
    severity: "low",
    priority: "low",
    status: "monitoring",
    impact: "minor",
    assigneeId: operator2.id,
    createdById: operator2.id,
    startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  });

  await db.insert(incidents).values({
    projectId: project1.id,
    title: "Network Connectivity Issue - Resolved",
    description: "Brief network connectivity issue between zones. Issue has been resolved.",
    severity: "medium",
    priority: "medium",
    status: "resolved",
    impact: "none",
    createdById: admin.id,
    startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
  });
  console.log("Created incidents for project 1");

  // Link alert to incident
  await db.update(alerts).set({ incidentId: incident1.id }).where(eq(alerts.id, alert1.id));

  // Create activities
  await db.insert(activities).values([
    {
      projectId: project1.id,
      userId: admin.id,
      alertId: alert1.id,
      action: "alert_created",
      details: "Alert received from Alertmanager",
    },
    {
      projectId: project1.id,
      userId: operator1.id,
      alertId: alert2.id,
      action: "alert_acknowledged",
      details: "Acknowledged and investigating",
    },
    {
      projectId: project1.id,
      userId: operator2.id,
      alertId: alert3.id,
      action: "alert_assigned",
      details: "Assigned to Maria Engineer",
    },
    {
      projectId: project1.id,
      userId: admin.id,
      incidentId: incident1.id,
      action: "incident_created",
      details: "Major incident created",
    },
    {
      projectId: project1.id,
      userId: admin.id,
      incidentId: incident1.id,
      action: "incident_status_changed",
      details: "Status changed to investigating",
    },
  ]);
  console.log("Created activities for project 1");

  // Create comments
  await db.insert(comments).values([
    {
      projectId: project1.id,
      userId: admin.id,
      alertId: alert1.id,
      content: "Looking into this issue. Initial analysis shows a memory leak in the application.",
    },
    {
      projectId: project1.id,
      userId: operator1.id,
      alertId: alert2.id,
      content: "Increased connection pool size temporarily. Monitoring for improvement.",
    },
    {
      projectId: project1.id,
      userId: admin.id,
      incidentId: incident1.id,
      content: "Rolled back recent deployment. Monitoring system stability.",
    },
  ]);
  console.log("Created comments");

  // Create project 2 (E-commerce Platform - minimal data)
  const [project2] = await db.insert(projects).values({
    name: "E-commerce Platform",
    shortName: "SHOP",
    webhookKey: randomBytes(16).toString("hex"),
    createdById: operator1.id,
  }).returning();
  console.log("Created project:", project2.name);

  await db.insert(projectMembers).values([
    { userId: operator1.id, projectId: project2.id, role: "admin" },
    { userId: admin.id, projectId: project2.id, role: "member" },
  ]);

  // Create default categories for project 2
  await db.insert(categories).values([
    { projectId: project2.id, name: "Payment", color: "#10B981", isDefault: true },
    { projectId: project2.id, name: "Inventory", color: "#F59E0B", isDefault: true },
    { projectId: project2.id, name: "Orders", color: "#3B82F6", isDefault: true },
  ]);

  await db.insert(alerts).values({
    projectId: project2.id,
    title: "Payment Gateway Timeout",
    description: "Stripe API calls are timing out intermittently.",
    source: "manual",
    severity: "high",
    status: "new",
    createdById: operator1.id,
  });
  console.log("Created data for project 2");

  console.log("\n=== Seed Complete ===");
  console.log("\nTest accounts (password: password123):");
  console.log("- admin@alerthub.com (admin with projects)");
  console.log("- operator@alerthub.com (operator with projects)");
  console.log("- maria@alerthub.com (operator with projects)");
  console.log("- viewer@alerthub.com (viewer with projects)");
  console.log("- new1@example.com (no projects - fresh user)");
  console.log("- new2@example.com (no projects - fresh user)");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  });
