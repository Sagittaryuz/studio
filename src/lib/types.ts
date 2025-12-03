export type UserRole = 'admin' | 'operator' | 'read-only';

export interface Vehicle {
  id: string;
  fleetNumber?: string;
  plate: string;
  category: CategoryID;
  currentKm: number;
  active: boolean;
  photoUrl: string;
  notes?: string;
}

export interface Service {
  id:string;
  name: string;
  categoryId: CategoryID;
  order: number;
}

export type ServiceStatus = 'OK' | 'ALERTA' | 'VENCIDO';

// This is the type that comes from Firestore, with a string date
export interface RawVehicleService {
  id: string;
  vehicleId: string;
  serviceId: string;
  lastDate: string; // ISO date string
  lastKm: number;
  supplier: string;
  responsible: string;
  notes?: string;
  attachments?: string[];
  months?: number;
  km?: number;
}

export interface VehicleService {
  id: string;
  vehicleId: string;
  serviceId: string;
  lastDate: Date; // Converted to Date object
  lastKm: number;
  supplier: string;
  responsible: string; // user name or id
  nextDate: Date;
  nextKm: number;
  status: ServiceStatus;
  notes?: string;
  attachments?: string[];
  // Parameters are now per vehicle-service instance
  months?: number;
  km?: number;
}

export interface RawCorrectiveServiceRecord {
    id: string;
    vehicleId: string;
    serviceName: string;
    date: string; // ISO date string
    cost: number;
    supplier: string;
    notes?: string;
    attachments?: string[];
    createdAt: string; // ISO date string
}

export interface CorrectiveServiceRecord {
    id: string;
    vehicleId: string;
    serviceName: string;
    date: Date;
    cost: number;
    supplier: string;
    notes?: string;
    attachments?: string[];
    createdAt: Date;
}


export type CategoryID = 'LOGISTICO' | 'EMPILHADEIRAS' | 'PASSEIO' | 'MOTOS' | 'GERADORES';

export interface Category {
  id: CategoryID;
  name: string;
  order: number;
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
  correctiveServices: CorrectiveServiceRecord[];
  userRole: UserRole;
}

// Type for the combined data used in the new maintenance table
export interface MergedServiceData {
  serviceInfo: Service;
  vehicleService: VehicleService | null; // It can be null if never performed
}
