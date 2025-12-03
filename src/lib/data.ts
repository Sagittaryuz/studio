

import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { addMonths, differenceInDays, parseISO } from 'date-fns';
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
  RawVehicleService,
  RawCorrectiveServiceRecord,
  CorrectiveServiceRecord,
  AppUser,
} from './types';
import { initializeFirebaseAdmin } from '@/firebase/server-init';


/**
 * Calculates the status of a single service for a vehicle.
 */
function getServiceStatus(
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


/**
 * Processes raw data from Firestore to add status and next service info.
 */
export async function getDashboardData(userRole: UserRole): Promise<DashboardData> {
  const { firestore: db } = initializeFirebaseAdmin();
  
  const categoriesQuery = query(collection(db, 'categories'), orderBy('order'));

  const [vehiclesSnap, servicesSnap, vehicleServicesSnap, categoriesSnap, correctiveServicesSnap, usersSnap] = await Promise.all([
    getDocs(collection(db, 'vehicles')),
    getDocs(collection(db, 'services')),
    getDocs(collection(db, 'vehicleServices')),
    getDocs(categoriesQuery),
    getDocs(collection(db, 'correctiveServiceRecords')),
    getDocs(collection(db, 'users')),
  ]);

  const allVehicles: Vehicle[] = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
  const allServices: Service[] = servicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
  const allCategories: Category[] = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  const allAppUsers: AppUser[] = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));
  
  const allRawVehicleServices: RawVehicleService[] = vehicleServicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RawVehicleService));

  // Convert raw string dates from Firestore into Date objects
  const allVehicleServices = allRawVehicleServices.map(vs => ({
      ...vs,
      lastDate: vs.lastDate ? parseISO(vs.lastDate) : new Date(2000, 0, 1),
      warrantyDate: vs.warrantyDate ? parseISO(vs.warrantyDate) : undefined,
  }));

  const allRawCorrectiveServices: RawCorrectiveServiceRecord[] = correctiveServicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as RawCorrectiveServiceRecord));
  const allCorrectiveServices: CorrectiveServiceRecord[] = allRawCorrectiveServices.map(cs => ({
      ...cs,
      date: parseISO(cs.date),
      warrantyDate: cs.warrantyDate ? parseISO(cs.warrantyDate) : undefined,
  }));


  const processedVehicleServices = allVehicleServices.map((vs) => {
    const vehicle = allVehicles.find(v => v.id === vs.vehicleId);
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

  const vehiclesWithStatus: VehicleWithStatus[] = allVehicles.filter(v => v.active).map((v) => {
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
        const serviceInfo = allServices.find(s => s.id === nextDueService.serviceId);
        const byKm = nextDueService.nextKm !== Infinity ? `${nextDueService.nextKm.toLocaleString('pt-BR')} km` : '';
        const byDate = nextDueService.nextDate < new Date('2999-01-01') ? `${nextDueService.nextDate.toLocaleDateString('pt-BR')}` : '';
        const separator = byKm && byDate ? ' ou ' : '';
        nextServiceSummary = `${serviceInfo?.name || 'Serviço'} em ${byKm}${separator}${byDate}`;
    }


    return { ...v, status: overallStatus, nextServiceSummary };
  });

  const categoriesWithStatus: CategoryWithStatus[] = allCategories.map(cat => {
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


  return {
    vehicles: vehiclesWithStatus,
    services: allServices,
    vehicleServices: processedVehicleServices as VehicleService[],
    categories: categoriesWithStatus,
    correctiveServices: allCorrectiveServices,
    userRole,
    appUsers: allAppUsers,
  };
}
