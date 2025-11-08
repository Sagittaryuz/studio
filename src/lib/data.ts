import {
  Car,
  Cog,
  Truck,
  Bike,
  Warehouse,
} from 'lucide-react';
import { addMonths, differenceInDays } from 'date-fns';
import type {
  Category,
  DashboardData,
  Service,
  Vehicle,
  VehicleService,
  VehicleWithStatus,
  ServiceStatus,
  UserRole,
  CategoryWithStatus,
} from './types';

// --- MOCK DATABASE ---

const CATEGORIES: Category[] = [
  { id: 'LOGISTICO', name: 'Logístico' },
  { id: 'EMPILHADEIRAS', name: 'Empilhadeiras' },
  { id: 'PASSEIO', name: 'Passeio' },
  { id: 'MOTOS', name: 'Motos' },
  { id: 'GERADORES', name: 'Geradores' },
];

const VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'RBC1A23', category: 'LOGISTICO', currentKm: 112500, active: true, photoUrl: 'https://picsum.photos/seed/truck1/600/400' },
  { id: 'v2', plate: 'SDF4B56', category: 'LOGISTICO', currentKm: 85300, active: true, photoUrl: 'https://picsum.photos/seed/truck2/600/400' },
  { id: 'v3', plate: 'GHI7C89', category: 'PASSEIO', currentKm: 45600, active: true, photoUrl: 'https://picsum.photos/seed/car1/600/400' },
  { id: 'v4', plate: 'JKL0D12', category: 'PASSEIO', currentKm: 22100, active: false, photoUrl: 'https://picsum.photos/seed/car2/600/400' },
  { id: 'v5', plate: 'MNO3E45', category: 'MOTOS', currentKm: 12500, active: true, photoUrl: 'https://picsum.photos/seed/bike1/600/400' },
  { id: 'v6', plate: 'EMP001', category: 'EMPILHADEIRAS', currentKm: 1500, active: true, photoUrl: 'https://picsum.photos/seed/forklift1/600/400' },
  { id: 'v7', plate: 'GER002', category: 'GERADORES', currentKm: 850, active: true, photoUrl: 'https://picsum.photos/seed/generator1/600/400' },
];

const SERVICES: Service[] = [
  { id: 's1', name: 'Troca de Óleo do Motor', defaultMonths: 6, defaultKm: 10000, defaultSupplier: 'Rodobens' },
  { id: 's2', name: 'Filtro de Ar', defaultMonths: 12, defaultKm: 20000, defaultSupplier: 'AutoZone' },
  { id: 's3', name: 'Alinhamento e Balanceamento', defaultMonths: 6, defaultKm: 10000, defaultSupplier: 'PneuStore' },
  { id: 's4', name: 'Filtro de Combustível', defaultMonths: 12, defaultKm: 15000, defaultSupplier: 'MercadoCar' },
];

const VEHICLE_SERVICES_HISTORY: Omit<VehicleService, 'nextDate' | 'nextKm' | 'status'>[] = [
  // Vehicle v1 (OK)
  { id: 'vs1', vehicleId: 'v1', serviceId: 's1', lastDate: new Date('2024-05-10'), lastKm: 105000, supplier: 'Rodobens', responsible: 'João Silva' },
  { id: 'vs2', vehicleId: 'v1', serviceId: 's2', lastDate: new Date('2024-01-15'), lastKm: 98000, supplier: 'AutoZone', responsible: 'João Silva' },
  // Vehicle v2 (Alerta e Vencido)
  { id: 'vs3', vehicleId: 'v2', serviceId: 's1', lastDate: new Date('2024-02-20'), lastKm: 76000, supplier: 'Rodobens', responsible: 'Maria Costa' }, // Vencido por KM
  { id: 'vs4', vehicleId: 'v2', serviceId: 's3', lastDate: new Date('2024-07-25'), lastKm: 82000, supplier: 'PneuStore', responsible: 'Maria Costa' }, // Alerta por data
  // Vehicle v3 (Alerta)
  { id: 'vs5', vehicleId: 'v3', serviceId: 's1', lastDate: new Date('2024-06-01'), lastKm: 40000, supplier: 'Rodobens', responsible: 'Carlos Lima' },
  // Vehicle v6 (OK)
  { id: 'vs6', vehicleId: 'v6', serviceId: 's1', lastDate: new Date('2024-06-01'), lastKm: 1000, supplier: 'Oficina Interna', responsible: 'Pedro' },
];


// --- BUSINESS LOGIC ---

// Configurable thresholds for ALERTA status
const ALERT_DAYS_THRESHOLD = 30;
const ALERT_KM_THRESHOLD = 1000;

/**
 * Calculates the status of a single maintenance service.
 */
function getServiceStatus(
  vs: Pick<VehicleService, 'nextDate' | 'nextKm'>,
  currentKm: number
): ServiceStatus {
  const today = new Date();
  
  // VENCIDO check
  if (vs.nextDate < today || vs.nextKm <= currentKm) {
    return 'VENCIDO';
  }

  // ALERTA check
  const daysUntilNext = differenceInDays(vs.nextDate, today);
  const kmUntilNext = vs.nextKm - currentKm;

  if (daysUntilNext <= ALERT_DAYS_THRESHOLD || kmUntilNext <= ALERT_KM_THRESHOLD) {
    return 'ALERTA';
  }

  // OK
  return 'OK';
}

/**
 * Processes the raw data to calculate statuses and next service info.
 */
async function processData(userRole: UserRole): Promise<DashboardData> {
  const vehicles = VEHICLES;
  const services = SERVICES;

  const vehicleServices: VehicleService[] = VEHICLE_SERVICES_HISTORY.map(vsHistory => {
    const service = services.find(s => s.id === vsHistory.serviceId)!;
    const vehicle = vehicles.find(v => v.id === vsHistory.vehicleId)!;

    const nextDate = addMonths(vsHistory.lastDate, service.defaultMonths);
    const nextKm = vsHistory.lastKm + service.defaultKm;

    const status = getServiceStatus({ nextDate, nextKm }, vehicle.currentKm);

    return {
      ...vsHistory,
      nextDate,
      nextKm,
      status,
    };
  });
  
  const statusOrder: Record<ServiceStatus, number> = { 'VENCIDO': 3, 'ALERTA': 2, 'OK': 1 };

  const vehiclesWithStatus: VehicleWithStatus[] = vehicles.map(vehicle => {
    const servicesForVehicle = vehicleServices.filter(vs => vs.vehicleId === vehicle.id);
    
    if (servicesForVehicle.length === 0) {
      return { ...vehicle, status: 'OK', nextServiceSummary: 'Nenhum serviço registrado' };
    }

    // Find the "worst" status among all services for this vehicle
    const overallStatus = servicesForVehicle.reduce((worst, current) => {
        return statusOrder[current.status] > statusOrder[worst] ? current.status : worst;
    }, 'OK' as ServiceStatus);
    
    // Find the next upcoming service to display in summary
    const nextService = servicesForVehicle.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime())[0];
    const serviceInfo = services.find(s => s.id === nextService.serviceId)!;

    const nextServiceSummary = `${serviceInfo.name} em ${nextService.nextKm.toLocaleString('pt-BR')} km ou ${nextService.nextDate.toLocaleDateString('pt-BR')}`;
    
    return {
      ...vehicle,
      status: overallStatus,
      nextServiceSummary
    };
  });

  const categoriesWithStatus: CategoryWithStatus[] = CATEGORIES.map(category => {
    const vehiclesInCategory = vehiclesWithStatus.filter(v => v.category === category.id);
    if(vehiclesInCategory.length === 0) {
        return { ...category, status: 'OK', pendingCount: 0 };
    }
    
    const overallStatus = vehiclesInCategory.reduce((worst, current) => {
        return statusOrder[current.status] > statusOrder[worst] ? current.status : worst;
    }, 'OK' as ServiceStatus);

    const pendingCount = vehiclesInCategory.filter(v => v.status === 'VENCIDO' || v.status === 'ALERTA').length;

    return { ...category, status: overallStatus, pendingCount };
  });

  return {
    vehicles: vehiclesWithStatus,
    services,
    vehicleServices,
    categories: categoriesWithStatus,
    userRole,
  };
}

/**
 * Simulates fetching and processing data from a database.
 */
export async function getDashboardData(userRole: UserRole): Promise<DashboardData> {
  // In a real app, this would involve async calls to Firestore
  return processData(userRole);
}

// In a real app, these would be in their own files and talk to Firestore
export async function getVehicleDetails(vehicleId: string) {
    const data = await processData('admin');
    const vehicle = data.vehicles.find(v => v.id === vehicleId);
    const servicesForVehicle = data.vehicleServices.filter(vs => vs.vehicleId === vehicleId);
    return { vehicle, services: servicesForVehicle, allServices: data.services };
}
