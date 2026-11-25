// Typed fetch wrappers for the backend REST API.
// All requests go to /api (proxied to localhost:3001 in Vite dev mode).

import type {
  CraneFormData,
  DesignFull,
  DesignListItem,
  FormulaMeta,
  PreviewResponse,
} from './types';

const BASE = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ errors: [{ field: 'body', message: `HTTP ${res.status}` }] }));
    throw body;
  }
  return res.json() as Promise<T>;
}

function formDataToPayload(d: CraneFormData) {
  return {
    name: d.name,
    capacity_t: parseFloat(d.capacity_t),
    span_m: parseFloat(d.span_m),
    lifting_height_m: parseFloat(d.lifting_height_m),
    duty_class: d.duty_class,
    hoist_speed_m_min: parseFloat(d.hoist_speed_m_min),
    traverse_speed_m_min: parseFloat(d.traverse_speed_m_min),
    travel_speed_m_min: parseFloat(d.travel_speed_m_min),
    supply: d.supply,
    floor_to_rail_height_m: parseFloat(d.floor_to_rail_height_m),
    hook_approach_left_mm: parseFloat(d.hook_approach_left_mm),
    hook_approach_right_mm: parseFloat(d.hook_approach_right_mm),
  };
}

export async function apiPreview(
  data: CraneFormData,
  signal: AbortSignal
): Promise<PreviewResponse> {
  const res = await fetch(`${BASE}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formDataToPayload(data)),
    signal,
  });
  return handleResponse<PreviewResponse>(res);
}

export async function apiCreateDesign(data: CraneFormData): Promise<DesignFull> {
  const res = await fetch(`${BASE}/designs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formDataToPayload(data)),
  });
  return handleResponse<DesignFull>(res);
}

export async function apiUpdateDesign(id: number, data: CraneFormData): Promise<DesignFull> {
  const res = await fetch(`${BASE}/designs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formDataToPayload(data)),
  });
  return handleResponse<DesignFull>(res);
}

export async function apiGetDesign(id: number): Promise<DesignFull> {
  const res = await fetch(`${BASE}/designs/${id}`);
  return handleResponse<DesignFull>(res);
}

export async function apiListDesigns(): Promise<DesignListItem[]> {
  const res = await fetch(`${BASE}/designs`);
  return handleResponse<DesignListItem[]>(res);
}

export async function apiDeleteDesign(id: number): Promise<void> {
  const res = await fetch(`${BASE}/designs/${id}`, { method: 'DELETE' });
  await handleResponse<unknown>(res);
}

export async function apiGetFormulas(): Promise<FormulaMeta[]> {
  const res = await fetch(`${BASE}/formulas`);
  return handleResponse<FormulaMeta[]>(res);
}

export function svgDownloadUrl(id: number): string {
  return `${BASE}/designs/${id}/drawing.svg`;
}
