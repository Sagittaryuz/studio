export type UserRole = 'admin' | 'operator' | 'read-only';

export interface Vehicle {
  id: string;
  plate: string;
  category: CategoryID;
  currentKm: number;
  active: boolean;
  photoUrl: string;
  notes?: string;
}

export interface Service {
  id: string;
  name: string;
  categoryId: CategoryID;
  defaultMonths: number;
  defaultKm: number;
  order: number;
}

export type ServiceStatus = 'OK' | 'ALERTA' | 'VENCIDO';

export interface VehicleService {
  id: string;
  vehicleId: string;
  serviceId: string;
  lastDate: Date;
  lastKm: number;
  supplier: string;
  responsible: string; // user name or id
  nextDate: Date;
  nextKm: number;
  status: ServiceStatus;
  notes?: string;
  attachments?: string[];
}

export type CategoryID = 'LOGISTICO' | 'EMPILHADEIRAS' | 'PASSEIO' | 'MOTOS' | 'GERADORES';

export interface Category {
  id: CategoryID;
  name: string;
}

export interface VehicleWithStatus extends Vehicle {
  status: ServiceStatus;
  nextServiceSummary: string;
}

export interface CategoryWithStatus extends Category {
  status: ServiceStatus;
  pendingCount: number;
}

export interface DashboardData {
  vehicles: VehicleWithStatus[];
  services: Service[];
  vehicleServices: VehicleService[];
  categories: CategoryWithStatus[];
  userRole: UserRole;
}

// Type for the combined data used in the new maintenance table
export interface MergedServiceData {
  serviceInfo: Service;
  vehicleService: VehicleService | null; // It can be null if never performed
}
