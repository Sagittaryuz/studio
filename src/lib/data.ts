
import { addMonths, differenceInDays, parseISO } from 'date-fns';
import type {
  Category,
  Service,
  Vehicle,
  VehicleService,
  VehicleWithStatus,
  ServiceStatus,
  CategoryWithStatus,
  RawVehicleService,
  CorrectiveServiceRecord,
} from './types';


/**
 * Calculates the status of a single service for a vehicle.
 */
export function getServiceStatus(
  vehicle: Vehicle,
  service: VehicleService,
): { status: ServiceStatus; nextDate: Date; nextKm: number } {
  const { lastDate, lastKm, months, km } = service;
  const { currentKm } = vehicle;

  if (lastKm === 0 && lastDate.getFullYear() < 2001) {
    return {
        status: 'ALERTA',
        nextDate: new Date(),
        nextKm: currentKm,
    };
  }
  
  const pMonths = months || 0;
  const pKm = km || 0;

  const nextDate = pMonths > 0 ? addMonths(lastDate, pMonths) : new Date('2999-12-31');
  const nextKm = pKm > 0 ? lastKm + pKm : Infinity;

  const daysUntilNextDate = differenceInDays(nextDate, new Date());
  const kmUntilNextService = nextKm - currentKm;

  let status: ServiceStatus = 'OK';
  const isKmAlert = pKm > 0 && kmUntilNextService <= pKm * 0.1; // 10% threshold
  const isDateAlert = pMonths > 0 && daysUntilNextDate <= 30; // 30 days threshold

  if ((pKm > 0 && currentKm >= nextKm) || (pMonths > 0 && new Date() >= nextDate)) {
    status = 'VENCIDO';
  } else if (isKmAlert || isDateAlert) {
    status = 'ALERTA';
  }

  return { status, nextDate, nextKm };
}


export function processDashboardData(
    vehicles: Vehicle[],
    services: Service[],
    rawVehicleServices: RawVehicleService[],
    categories: Category[],
    correctiveServices: CorrectiveServiceRecord[]
): Omit<DashboardData, 'userRole' | 'appUsers'> {

    const allVehicleServices = rawVehicleServices.map(vs => ({
        ...vs,
        lastDate: vs.lastDate ? parseISO(vs.lastDate) : new Date(2000, 0, 1),
        warrantyDate: vs.warrantyDate ? parseISO(vs.warrantyDate) : undefined,
    }));

    const processedVehicleServices = allVehicleServices.map((vs) => {
        const vehicle = vehicles.find(v => v.id === vs.vehicleId);
        if (!vehicle) {
        return {
            ...vs,
            status: 'OK',
            nextDate: new Date('2999-12-31'),
            nextKm: Infinity,
        } as VehicleService;
        }
        const { status, nextDate, nextKm } = getServiceStatus(vehicle, vs as VehicleService);
        return { ...vs, status, nextDate, nextKm };
    });

    const vehiclesWithStatus: VehicleWithStatus[] = vehicles.filter(v => v.active).map((v) => {
        const servicesForVehicle = processedVehicleServices.filter(vs => vs.vehicleId === v.id);
        let overallStatus: ServiceStatus = 'OK';
        let nextServiceSummary = 'Nenhum serviço pendente';

        if (servicesForVehicle.some(s => s.status === 'VENCIDO')) {
        overallStatus = 'VENCIDO';
        } else if (servicesForVehicle.some(s => s.status === 'ALERTA')) {
        overallStatus = 'ALERTA';
        }
        
        const nextDueService = servicesForVehicle
        .filter(s => s.status !== 'OK')
        .sort((a, b) => {
            if (!a.nextDate || !b.nextDate) return 0;
            const aDays = differenceInDays(a.nextDate, new Date());
            const bDays = differenceInDays(b.nextDate, new Date());
            return aDays - bDays;
        })[0];

        if (nextDueService) {
            const serviceInfo = services.find(s => s.id === nextDueService.serviceId);
            const byKm = nextDueService.nextKm !== Infinity ? `${nextDueService.nextKm.toLocaleString('pt-BR')} km` : '';
            const byDate = nextDueService.nextDate < new Date('2999-01-01') ? `${nextDueService.nextDate.toLocaleDateString('pt-BR')}` : '';
            const separator = byKm && byDate ? ' ou ' : '';
            nextServiceSummary = `${serviceInfo?.name || 'Serviço'} em ${byKm}${separator}${byDate}`;
        }


        return { ...v, status: overallStatus, nextServiceSummary };
    });

    const categoriesWithStatus: CategoryWithStatus[] = categories.map(cat => {
        const vehiclesInCategory = vehiclesWithStatus.filter(v => v.category === cat.id);
        let categoryStatus: ServiceStatus = 'OK';
        let pendingCount = 0;

        if (vehiclesInCategory.some(v => v.status === 'VENCIDO')) {
            categoryStatus = 'VENCIDO';
        } else if (vehiclesInCategory.some(v => v.status === 'ALERTA')) {
            categoryStatus = 'ALERTA';
        }

        pendingCount = vehiclesInCategory.filter(v => v.status === 'VENCIDO' || v.status === 'ALERTA').length;

        return { ...cat, status: categoryStatus, pendingCount };
    });

    const allCorrectiveServicesWithDate = correctiveServices.map(cs => ({
        ...cs,
        date: parseISO(cs.date as unknown as string),
        createdAt: parseISO(cs.createdAt as unknown as string),
        warrantyDate: cs.warrantyDate ? parseISO(cs.warrantyDate as unknown as string) : undefined
    }));


    return {
        vehicles: vehiclesWithStatus,
        services: services,
        vehicleServices: processedVehicleServices as VehicleService[],
        categories: categoriesWithStatus,
        correctiveServices: allCorrectiveServicesWithDate,
    };
}


export interface DashboardData {
    vehicles: VehicleWithStatus[];
    services: Service[];
    vehicleServices: VehicleService[];
    categories: CategoryWithStatus[];
    correctiveServices: CorrectiveServiceRecord[];
    userRole: UserRole;
    appUsers: any[];
}
