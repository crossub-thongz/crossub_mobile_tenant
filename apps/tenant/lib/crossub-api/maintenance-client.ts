import { api } from '@/lib/api';

export interface ApiMaintenanceParty {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ApiMaintenanceRequest {
  id: string;
  trackingNumber?: string;
  title?: string;
  description?: string;
  status?: string;
  propertyAddress?: string;
  tenant?: ApiMaintenanceParty;
  createdAt?: string;
}

export interface ApiMaintenanceState {
  requests: ApiMaintenanceRequest[];
}

export async function submitMaintenanceRequest(body: {
  title: string;
  description: string;
  category?: string;
  area?: string;
  urgency?: string;
  propertyAddress?: string;
}): Promise<ApiMaintenanceState> {
  return api.post<ApiMaintenanceState>('/maintenance/requests', body);
}
