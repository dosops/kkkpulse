export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'in_progress' | 'resolved';
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type IncidentCategory = 'hardware' | 'software' | 'network' | 'security' | 'other';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface AlertAction {
  id: string;
  type: 'taken_to_work' | 'inspected' | 'incident_registered';
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: AlertStatus;
  source: 'manual' | 'system';
  imageUri?: string;
  createdAt: Date;
  actions: AlertAction[];
  metadata?: Record<string, string>;
  comments: Comment[];
}

export interface Incident {
  id: string;
  alertId: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  category: IncidentCategory;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  notes: string;
  customFields: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  incidentStartTime?: Date;
  incidentEndTime?: Date;
  consequences?: string;
  downtimeMinutes?: number;
  comments: Comment[];
}

export interface ActivityItem {
  id: string;
  type: 'alert_created' | 'alert_taken' | 'alert_inspected' | 'incident_registered' | 'incident_updated' | 'incident_closed';
  userId: string;
  userName: string;
  targetId: string;
  targetTitle: string;
  timestamp: Date;
}

const currentUser: User = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@company.com',
  avatar: 1,
};

let alerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'High CPU Usage on Server-01',
    description: 'CPU usage has exceeded 90% threshold for more than 5 minutes. Immediate attention required.',
    severity: 'critical',
    status: 'new',
    source: 'system',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    actions: [],
    metadata: { 'Server': 'Server-01', 'Region': 'US-East' },
    comments: [],
  },
  {
    id: 'alert-2',
    title: 'Database Connection Pool Exhausted',
    description: 'Connection pool has reached maximum capacity. New connections are being rejected.',
    severity: 'high',
    status: 'in_progress',
    source: 'system',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    actions: [
      { id: 'action-1', type: 'taken_to_work', userId: 'user-1', userName: 'John Doe', timestamp: new Date(Date.now() - 10 * 60 * 1000) },
    ],
    metadata: { 'Database': 'PostgreSQL', 'Pool Size': '100' },
    comments: [],
  },
  {
    id: 'alert-3',
    title: 'SSL Certificate Expiring Soon',
    description: 'SSL certificate for api.company.com will expire in 7 days.',
    severity: 'medium',
    status: 'new',
    source: 'system',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    actions: [],
    metadata: { 'Domain': 'api.company.com', 'Expiry': '7 days' },
    comments: [],
  },
  {
    id: 'alert-4',
    title: 'Unusual Login Activity Detected',
    description: 'Multiple failed login attempts from IP 192.168.1.100.',
    severity: 'high',
    status: 'new',
    source: 'system',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    actions: [],
    metadata: { 'IP Address': '192.168.1.100', 'Attempts': '15' },
    comments: [],
  },
  {
    id: 'alert-5',
    title: 'Disk Space Warning',
    description: 'Storage on backup-server is at 85% capacity.',
    severity: 'low',
    status: 'resolved',
    source: 'system',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    actions: [
      { id: 'action-2', type: 'taken_to_work', userId: 'user-2', userName: 'Jane Smith', timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000) },
      { id: 'action-3', type: 'inspected', userId: 'user-2', userName: 'Jane Smith', timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000) },
    ],
    metadata: { 'Server': 'backup-server', 'Usage': '85%' },
    comments: [],
  },
];

let incidents: Incident[] = [
  {
    id: 'INC-2024-001',
    alertId: 'alert-old-1',
    title: 'Production Database Outage',
    description: 'Complete database outage affecting all production services.',
    severity: 'critical',
    status: 'resolved',
    category: 'software',
    priority: 'P0',
    assigneeId: 'user-1',
    assigneeName: 'John Doe',
    notes: 'Root cause: Connection pool misconfiguration after deployment.',
    customFields: { 'Impact': 'All customers', 'Downtime': '45 minutes' },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    comments: [],
  },
  {
    id: 'INC-2024-002',
    alertId: 'alert-old-2',
    title: 'Network Latency Issues',
    description: 'Intermittent high latency affecting API responses.',
    severity: 'medium',
    status: 'in_progress',
    category: 'network',
    priority: 'P2',
    assigneeId: 'user-2',
    assigneeName: 'Jane Smith',
    notes: 'Investigating CDN configuration.',
    customFields: { 'Affected Region': 'EU-West', 'Latency': '500ms+' },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    comments: [],
  },
];

let activities: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'alert_created',
    userId: 'system',
    userName: 'System',
    targetId: 'alert-1',
    targetTitle: 'High CPU Usage on Server-01',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
  },
  {
    id: 'activity-2',
    type: 'alert_taken',
    userId: 'user-1',
    userName: 'John Doe',
    targetId: 'alert-2',
    targetTitle: 'Database Connection Pool Exhausted',
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
  },
  {
    id: 'activity-3',
    type: 'alert_created',
    userId: 'system',
    userName: 'System',
    targetId: 'alert-2',
    targetTitle: 'Database Connection Pool Exhausted',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
  },
  {
    id: 'activity-4',
    type: 'incident_registered',
    userId: 'user-2',
    userName: 'Jane Smith',
    targetId: 'INC-2024-002',
    targetTitle: 'Network Latency Issues',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

let nextAlertNum = 6;
let nextIncidentNum = 3;
let nextActivityNum = 5;
let listeners: (() => void)[] = [];

let alertsSnapshot = [...alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
let incidentsSnapshot = [...incidents].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
let activitiesSnapshot = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

function computeStatusMetrics() {
  const closedIncidents = incidents.filter(i => i.status === 'closed');
  const totalDowntimeMinutes = closedIncidents.reduce((sum, i) => sum + (i.downtimeMinutes || 0), 0);
  const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'in_progress');
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved' || i.status === 'closed');
  
  const totalMinutesIn30Days = 30 * 24 * 60;
  const availabilityPercent = ((totalMinutesIn30Days - totalDowntimeMinutes) / totalMinutesIn30Days) * 100;

  return {
    availabilityPercent: Math.max(0, Math.min(100, availabilityPercent)),
    totalDowntimeMinutes,
    totalIncidents: incidents.length,
    openIncidentsCount: openIncidents.length,
    resolvedIncidentsCount: resolvedIncidents.length,
  };
}

let statusMetricsSnapshot = computeStatusMetrics();

function notifyListeners() {
  alertsSnapshot = [...alerts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  incidentsSnapshot = [...incidents].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  activitiesSnapshot = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  statusMetricsSnapshot = computeStatusMetrics();
  listeners.forEach(l => l());
}

export const store = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  getCurrentUser() {
    return currentUser;
  },

  getAlerts() {
    return alertsSnapshot;
  },

  getAlert(id: string) {
    return alerts.find(a => a.id === id);
  },

  createAlert(data: Omit<Alert, 'id' | 'createdAt' | 'actions' | 'status' | 'comments'>) {
    const alert: Alert = {
      ...data,
      id: `alert-${nextAlertNum++}`,
      status: 'new',
      createdAt: new Date(),
      actions: [],
      comments: [],
    };
    alerts = [alert, ...alerts];
    
    activities = [{
      id: `activity-${nextActivityNum++}`,
      type: 'alert_created',
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: alert.id,
      targetTitle: alert.title,
      timestamp: new Date(),
    }, ...activities];

    notifyListeners();
    return alert;
  },

  takeAlertToWork(alertId: string) {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.status = 'in_progress';
    alert.actions = [...alert.actions, {
      id: `action-${Date.now()}`,
      type: 'taken_to_work',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date(),
    }];

    activities = [{
      id: `activity-${nextActivityNum++}`,
      type: 'alert_taken',
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: alert.id,
      targetTitle: alert.title,
      timestamp: new Date(),
    }, ...activities];

    notifyListeners();
  },

  inspectAlert(alertId: string) {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    alert.actions = [...alert.actions, {
      id: `action-${Date.now()}`,
      type: 'inspected',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date(),
    }];

    activities = [{
      id: `activity-${nextActivityNum++}`,
      type: 'alert_inspected',
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: alert.id,
      targetTitle: alert.title,
      timestamp: new Date(),
    }, ...activities];

    notifyListeners();
  },

  getIncidents() {
    return incidentsSnapshot;
  },

  getIncident(id: string) {
    return incidents.find(i => i.id === id);
  },

  createIncident(alertId: string, data: Omit<Incident, 'id' | 'alertId' | 'createdAt' | 'updatedAt'>) {
    const alert = alerts.find(a => a.id === alertId);
    if (!alert) return;

    const incident: Incident = {
      ...data,
      id: `INC-2024-${String(nextIncidentNum++).padStart(3, '0')}`,
      alertId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    incidents = [incident, ...incidents];

    alert.status = 'resolved';
    alert.actions = [...alert.actions, {
      id: `action-${Date.now()}`,
      type: 'incident_registered',
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date(),
    }];

    activities = [{
      id: `activity-${nextActivityNum++}`,
      type: 'incident_registered',
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: incident.id,
      targetTitle: incident.title,
      timestamp: new Date(),
    }, ...activities];

    notifyListeners();
    return incident;
  },

  closeIncident(incidentId: string, data: { startTime: Date; endTime: Date; consequences: string }) {
    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return;

    const downtimeMinutes = Math.round((data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60));
    
    incident.status = 'closed';
    incident.closedAt = new Date();
    incident.incidentStartTime = data.startTime;
    incident.incidentEndTime = data.endTime;
    incident.consequences = data.consequences;
    incident.downtimeMinutes = downtimeMinutes;
    incident.updatedAt = new Date();

    activities = [{
      id: `activity-${nextActivityNum++}`,
      type: 'incident_closed',
      userId: currentUser.id,
      userName: currentUser.name,
      targetId: incident.id,
      targetTitle: incident.title,
      timestamp: new Date(),
    }, ...activities];

    notifyListeners();
    return incident;
  },

  getStatusMetrics() {
    return statusMetricsSnapshot;
  },

  getActivities() {
    return activitiesSnapshot;
  },

  addAlertComment(alertId: string, text: string) {
    const alertIndex = alerts.findIndex(a => a.id === alertId);
    if (alertIndex === -1) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date(),
    };
    
    alerts = alerts.map((a, i) => 
      i === alertIndex ? { ...a, comments: [...a.comments, comment] } : a
    );
    notifyListeners();
    return comment;
  },

  addIncidentComment(incidentId: string, text: string) {
    const incidentIndex = incidents.findIndex(i => i.id === incidentId);
    if (incidentIndex === -1) return;

    const comment: Comment = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text,
      createdAt: new Date(),
    };
    
    incidents = incidents.map((inc, i) => 
      i === incidentIndex ? { ...inc, comments: [...inc.comments, comment], updatedAt: new Date() } : inc
    );
    notifyListeners();
    return comment;
  },
};
