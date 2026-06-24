import type { WidgetInstance, WidgetLayout } from '../types';

export interface DashboardPayload {
  widgets: Record<string, WidgetInstance>;
  layout: WidgetLayout[];
}

export async function loadDashboard(): Promise<DashboardPayload> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
  return res.json();
}

export async function saveDashboard(payload: DashboardPayload): Promise<void> {
  const res = await fetch('/api/dashboard', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to save dashboard (${res.status})`);
}
