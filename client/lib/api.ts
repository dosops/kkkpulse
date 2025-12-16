import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApiUrl, apiRequest } from '@/lib/query-client';

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged' | 'in_progress' | 'resolved';
export type IncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'closed';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  source: string;
  externalId: string | null;
  fingerprint: string | null;
  severity: Severity;
  status: AlertStatus;
  categoryId: string | null;
  assigneeId: string | null;
  incidentId: string | null;
  createdById: string | null;
  rawPayload: any;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface Incident {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  severity: Severity;
  priority: Priority;
  status: IncidentStatus;
  impact: string | null;
  assigneeId: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  resolvedAt: string | null;
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string | null;
  alertId: string | null;
  incidentId: string | null;
  action: string;
  details: string | null;
  metadata: any;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export interface Comment {
  id: string;
  projectId: string;
  alertId: string | null;
  incidentId: string | null;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    displayName: string | null;
  };
}

export interface Category {
  id: string;
  projectId: string;
  name: string;
  color: string | null;
  isDefault: boolean;
}

export interface StatusData {
  currentStatus: 'operational' | 'degraded' | 'outage';
  activeIncidents: number;
  timeline: Array<{
    date: string;
    status: string;
    incidents: number;
  }>;
}

async function fetchApi<T>(path: string): Promise<T> {
  const response = await fetch(new URL(path, getApiUrl()).toString(), {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

async function mutateApi<T>(path: string, method: string, body?: any): Promise<T> {
  const response = await fetch(new URL(path, getApiUrl()).toString(), {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API error: ${response.status}`);
  }
  return response.json();
}

export function useAlerts() {
  return useQuery<Alert[]>({
    queryKey: ['/api/alerts'],
    queryFn: () => fetchApi('/api/alerts'),
    staleTime: 30000,
  });
}

export function useAlert(id: string) {
  return useQuery<Alert>({
    queryKey: ['/api/alerts', id],
    queryFn: () => fetchApi(`/api/alerts/${id}`),
    enabled: !!id,
  });
}

export function useAlertHistory(id: string) {
  return useQuery<Activity[]>({
    queryKey: ['/api/alerts', id, 'history'],
    queryFn: () => fetchApi(`/api/alerts/${id}/history`),
    enabled: !!id,
  });
}

export function useAlertComments(id: string) {
  return useQuery<Comment[]>({
    queryKey: ['/api/alerts', id, 'comments'],
    queryFn: () => fetchApi(`/api/alerts/${id}/comments`),
    enabled: !!id,
  });
}

export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description?: string; severity: Severity }) =>
      mutateApi<Alert>('/api/alerts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useUpdateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; assigneeId?: string | null }) =>
      mutateApi<Alert>(`/api/alerts/${id}`, 'PUT', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useAddAlertComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, content }: { alertId: string; content: string }) =>
      mutateApi<Comment>(`/api/alerts/${alertId}/comments`, 'POST', { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts', variables.alertId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useIncidents() {
  return useQuery<Incident[]>({
    queryKey: ['/api/incidents'],
    queryFn: () => fetchApi('/api/incidents'),
    staleTime: 30000,
  });
}

export function useIncident(id: string) {
  return useQuery<Incident>({
    queryKey: ['/api/incidents', id],
    queryFn: () => fetchApi(`/api/incidents/${id}`),
    enabled: !!id,
  });
}

export function useIncidentHistory(id: string) {
  return useQuery<Activity[]>({
    queryKey: ['/api/incidents', id, 'history'],
    queryFn: () => fetchApi(`/api/incidents/${id}/history`),
    enabled: !!id,
  });
}

export function useIncidentComments(id: string) {
  return useQuery<Comment[]>({
    queryKey: ['/api/incidents', id, 'comments'],
    queryFn: () => fetchApi(`/api/incidents/${id}/comments`),
    enabled: !!id,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { 
      title: string; 
      description?: string; 
      severity: Severity; 
      priority: Priority;
      alertId?: string;
    }) => mutateApi<Incident>('/api/incidents', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/alerts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: string; severity?: string }) =>
      mutateApi<Incident>(`/api/incidents/${id}`, 'PUT', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useAddIncidentComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ incidentId, content }: { incidentId: string; content: string }) =>
      mutateApi<Comment>(`/api/incidents/${incidentId}/comments`, 'POST', { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/incidents', variables.incidentId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
    },
  });
}

export function useActivities(limit: number = 50) {
  return useQuery<Activity[]>({
    queryKey: ['/api/activities', { limit }],
    queryFn: () => fetchApi(`/api/activities?limit=${limit}`),
    staleTime: 30000,
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => fetchApi('/api/categories'),
    staleTime: 60000,
  });
}

export function useStatus() {
  return useQuery<StatusData>({
    queryKey: ['/api/status'],
    queryFn: () => fetchApi('/api/status'),
    staleTime: 60000,
  });
}

export function useProjectMembers() {
  return useQuery<any[]>({
    queryKey: ['/api/projects/members'],
    queryFn: () => fetchApi('/api/projects/members'),
    staleTime: 60000,
  });
}
