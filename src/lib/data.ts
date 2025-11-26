

import {
  Car,
  Cog,
  Truck,
  Bike,
  Warehouse,
} from 'lucide-react';
import { addMonths, differenceInDays, parse } from 'date-fns';
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
  CategoryID,
} from './types';

// --- MOCK DATABASE ---

const CATEGORIES: Category[] = [
  { id: 'LOGISTICO', name: 'Logístico' },
  { id: 'EMPILHADEIRAS', name: 'Empilhadeiras' },
  { id: 'PASSEIO', name: 'Passeio' },
  { id: 'MOTOS', name: 'Motos' },
  { id: 'GERADORES', name: 'Geradores' },
];

let VEHICLES: Vehicle[] = [
  { id: 'v1', plate: 'ONC 9390', category: 'LOGISTICO', currentKm: 404714, active: true, photoUrl: 'https://picsum.photos/seed/truck1/600/400' },
  { id: 'v2', plate: 'PQT 1H75', category: 'LOGISTICO', currentKm: 343000, active: true, photoUrl: 'https://picsum.photos/seed/truck2/600/400' },
  { id: 'v3', plate: 'RBU 9C38', category: 'LOGISTICO', currentKm: 178315, active: true, photoUrl: 'https://picsum.photos/seed/truck3/600/400' },
  { id: 'v4', plate: 'RCB 0E98', category: 'LOGISTICO', currentKm: 184786, active: true, photoUrl: 'https://picsum.photos/seed/truck4/600/400' },
  { id: 'v5', plate: 'SCX 0J04', category: 'LOGISTICO', currentKm: 116000, active: true, photoUrl: 'https://picsum.photos/seed/truck5/600/400' },
  { id: 'v6', plate: 'SCP 5J36', category: 'LOGISTICO', currentKm: 108000, active: true, photoUrl: 'https://picsum.photos/seed/truck6/600/400' },
  { id: 'v7', plate: 'OGS 8583', category: 'LOGISTICO', currentKm: 225000, active: true, photoUrl: 'https://picsum.photos/seed/truck7/600/400' },
  { id: 'v8', plate: 'RBS 5E06', category: 'LOGISTICO', currentKm: 72255, active: true, photoUrl: 'https://picsum.photos/seed/truck8/600/400' },
  { id: 'v9', plate: 'NWO 8655', category: 'LOGISTICO', currentKm: 3, active: true, photoUrl: 'https://picsum.photos/seed/truck9/600/400' },
  { id: 'v10', plate: 'OGS 8G13', category: 'LOGISTICO', currentKm: 193000, active: true, photoUrl: 'https://picsum.photos/seed/truck10/600/400' },
  { id: 'v11', plate: 'PQH 4780', category: 'LOGISTICO', currentKm: 113000, active: true, photoUrl: 'https://picsum.photos/seed/truck11/600/400' },
  { id: 'v12', plate: 'SCY 3I97', category: 'LOGISTICO', currentKm: 40350, active: true, photoUrl: 'https://picsum.photos/seed/truck12/600/400' },
  { id: 'v13', plate: 'PQE 3070', category: 'LOGISTICO', currentKm: 135300, active: true, photoUrl: 'https://picsum.photos/seed/truck13/600/400' },
  { id: 'v14', plate: 'NVO 8161', category: 'LOGISTICO', currentKm: 303676, active: true, photoUrl: 'https://picsum.photos/seed/truck14/600/400' },
  { id: 'v15', plate: 'ONC 9190', category: 'LOGISTICO', currentKm: 197000, active: true, photoUrl: 'https://picsum.photos/seed/truck15/600/400' },

  { id: 'v16', plate: 'HYSTER 60XT - 182', category: 'EMPILHADEIRAS', currentKm: 1300, active: true, photoUrl: 'https://picsum.photos/seed/forklift1/600/400' },
  { id: 'v17', plate: 'HYSTER 60FT - 75', category: 'EMPILHADEIRAS', currentKm: 14600, active: true, photoUrl: 'https://picsum.photos/seed/forklift2/600/400' },
  { id: 'v18', plate: 'HYSTER 60XT - 168', category: 'EMPILHADEIRAS', currentKm: 7039, active: true, photoUrl: 'https://picsum.photos/seed/forklift3/600/400' },
  { id: 'v19', plate: 'HYSTER 55XM - 76', category: 'EMPILHADEIRAS', currentKm: 139, active: true, photoUrl: 'https://picsum.photos/seed/forklift4/600/400' },
  { id: 'v20', plate: 'CLARK GTS30 - 132', category: 'EMPILHADEIRAS', currentKm: 10568, active: true, photoUrl: 'https://picsum.photos/seed/forklift5/600/400' },
  { id: 'v21', plate: 'TLC30 DIESEL - 179', category: 'EMPILHADEIRAS', currentKm: 1300, active: true, photoUrl: 'https://picsum.photos/seed/forklift6/600/400' },
  { id: 'v22', plate: 'STILL FMX17 - 153', category: 'EMPILHADEIRAS', currentKm: 2000, active: true, photoUrl: 'https://picsum.photos/seed/forklift7/600/400' },
  { id: 'v23', plate: 'STILL FMX17 - 154', category: 'EMPILHADEIRAS', currentKm: 1850, active: true, photoUrl: 'https://picsum.photos/seed/forklift8/600/400' },
  { id: 'v24', plate: 'CLARK C30 - 108', category: 'EMPILHADEIRAS', currentKm: 8150, active: true, photoUrl: 'https://picsum.photos/seed/forklift9/600/400' },
  { id: 'v25', plate: 'STILL EGV16 - 161', category: 'EMPILHADEIRAS', currentKm: 1000, active: true, photoUrl: 'https://picsum.photos/seed/forklift10/600/400' },
  { id: 'v26', plate: 'HYSTER 60XT - 181', category: 'EMPILHADEIRAS', currentKm: 2350, active: true, photoUrl: 'https://picsum.photos/seed/forklift11/600/400' },
  { id: 'v27', plate: 'CLARK C30 - 122', category: 'EMPILHADEIRAS', currentKm: 7700, active: true, photoUrl: 'https://picsum.photos/seed/forklift12/600/400' },
  { id: 'v28', plate: 'STILL EGV16 - 165', category: 'EMPILHADEIRAS', currentKm: 1400, active: true, photoUrl: 'https://picsum.photos/seed/forklift13/600/400' },

  { id: 'v29', plate: 'PQR 3H80', category: 'PASSEIO', currentKm: 250000, active: true, photoUrl: 'https://picsum.photos/seed/car1/600/400' },
  { id: 'v30', plate: 'RBO 1C73', category: 'PASSEIO', currentKm: 44000, active: true, photoUrl: 'https://picsum.photos/seed/car2/600/400' },
  { id: 'v31', plate: 'RBO 1C93', category: 'PASSEIO', currentKm: 28650, active: true, photoUrl: 'https://picsum.photos/seed/car3/600/400' },
  { id: 'v32', plate: 'SCN 5C62', category: 'PASSEIO', currentKm: 37500, active: true, photoUrl: 'https://picsum.photos/seed/car4/600/400' },
  { id: 'v33', plate: 'SCH 3I62', category: 'PASSEIO', currentKm: 67865, active: true, photoUrl: 'https://picsum.photos/seed/car5/600/400' },
  { id: 'v34', plate: 'PQE 9370', category: 'PASSEIO', currentKm: 106200, active: true, photoUrl: 'https://picsum.photos/seed/car6/600/400' },
  { id: 'v35', plate: 'SDC 3A35', category: 'PASSEIO', currentKm: 51000, active: true, photoUrl: 'https://picsum.photos/seed/car7/600/400' },
  { id: 'v36', plate: 'SCQ 2H05', category: 'PASSEIO', currentKm: 13000, active: true, photoUrl: 'https://picsum.photos/seed/car8/600/400' },
  { id: 'v37', plate: 'SDL 3D58', category: 'PASSEIO', currentKm: 1, active: true, photoUrl: 'https://picsum.photos/seed/car9/600/400' },
  { id: 'v38', plate: 'SDN 3G91', category: 'PASSEIO', currentKm: 1, active: true, photoUrl: 'https://picsum.photos/seed/car10/600/400' },

  { id: 'v39', plate: 'ONQ 8222', category: 'MOTOS', currentKm: 57400, active: true, photoUrl: 'https://picsum.photos/seed/bike1/600/400' },
  { id: 'v40', plate: 'RCA 5I35', category: 'MOTOS', currentKm: 25000, active: true, photoUrl: 'https://picsum.photos/seed/bike2/600/400' },
  { id: 'v41', plate: 'OMJ 7E43', category: 'MOTOS', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/bike3/600/400' },
  { id: 'v42', plate: 'RCL 6I62', category: 'MOTOS', currentKm: 9439, active: true, photoUrl: 'https://picsum.photos/seed/bike4/600/400' },
  { id: 'v43', plate: 'ONQ 5462', category: 'MOTOS', currentKm: 71175, active: true, photoUrl: 'https://picsum.photos/seed/bike5/600/400' },
  { id: 'v44', plate: 'NGL8763', category: 'MOTOS', currentKm: 53100, active: true, photoUrl: 'https://picsum.photos/seed/bike6/600/400' },

  { id: 'v45', plate: '86 - MATRIZ', category: 'GERADORES', currentKm: 393, active: true, photoUrl: 'https://picsum.photos/seed/generator1/600/400' },
  { id: 'v46', plate: '111 - CD', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator2/600/400' },
  { id: 'v47', plate: '87 - CATEDRAL', category: 'GERADORES', currentKm: 393, active: true, photoUrl: 'https://picsum.photos/seed/generator3/600/400' },
  { id: 'v48', plate: '112 - MINEIROS', category: 'GERADORES', currentKm: 187, active: true, photoUrl: 'https://picsum.photos/seed/generator4/600/400' },
  { id: 'v49', plate: '148 - RHARO', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator5/600/400' },
  { id: 'v50', plate: '162 - SAID ABDALLA', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator6/600/400' },
  { id: 'v51', plate: '98 - RIO VERDE', category: 'GERADORES', currentKm: 13, active: true, photoUrl: 'https://picsum.photos/seed/generator7/600/400' },
];


let SERVICES: Service[] = [
  { id: 's1', name: 'Óleo do motor', categoryId: 'LOGISTICO', defaultMonths: 12, defaultKm: 20000, order: 0 },
  { id: 's2', name: 'Filtro de diesel', categoryId: 'LOGISTICO', defaultMonths: 6, defaultKm: 10000, order: 1 },
  { id: 's3', name: 'Filtro separador de água', categoryId: 'LOGISTICO', defaultMonths: 6, defaultKm: 10000, order: 2 },
  { id: 's4', name: 'Filtro de arla', categoryId: 'LOGISTICO', defaultMonths: 18, defaultKm: 40000, order: 3 },
  { id: 's5', name: 'Óleo do câmbio', categoryId: 'LOGISTICO', defaultMonths: 18, defaultKm: 60000, order: 4 },
  { id: 's6', name: 'Óleo do diferencial', categoryId: 'LOGISTICO', defaultMonths: 18, defaultKm: 60000, order: 5 },
  { id: 's7', name: 'Revisão do sistema de arla', categoryId: 'LOGISTICO', defaultMonths: 72, defaultKm: 180000, order: 6 },
  { id: 's8', name: 'Rodizio de baterias', categoryId: 'LOGISTICO', defaultMonths: 3, defaultKm: 0, order: 7 },
  { id: 's9', name: 'Lubrificação', categoryId: 'LOGISTICO', defaultMonths: 1, defaultKm: 2500, order: 8 },
  { id: 's10', name: 'Extintor', categoryId: 'LOGISTICO', defaultMonths: 58, defaultKm: 0, order: 9 },
  { id: 's11', name: 'Revisão da suspensão, cubos, rodas e freios', categoryId: 'LOGISTICO', defaultMonths: 14, defaultKm: 0, order: 10 },
  { id: 's12', name: 'Radiador, intercooler e bloco do motor', categoryId: 'LOGISTICO', defaultMonths: 24, defaultKm: 0, order: 11 },
  { id: 's13', name: 'Tacógrafo', categoryId: 'LOGISTICO', defaultMonths: 24, defaultKm: 0, order: 12 },
  { id: 's14', name: 'Alinhamento', categoryId: 'LOGISTICO', defaultMonths: 6, defaultKm: 15000, order: 13 },
  { id: 's15', name: 'Regulagem de válvulas', categoryId: 'LOGISTICO', defaultMonths: 24, defaultKm: 0, order: 14 },
  { id: 's16', name: 'Óleo do motor e filtros', categoryId: 'PASSEIO', defaultMonths: 12, defaultKm: 10000, order: 0 },
  { id: 's17', name: 'Óleo da transmissão', categoryId: 'PASSEIO', defaultMonths: 24, defaultKm: 30000, order: 1 },
  { id: 's18', name: 'Óleo do motor PSI', categoryId: 'EMPILHADEIRAS', defaultMonths: 6, defaultKm: 250, order: 0 },
  { id: 's19', name: 'Óleo hidraulico', categoryId: 'EMPILHADEIRAS', defaultMonths: 18, defaultKm: 1500, order: 1 },
  { id: 's20', name: 'Correia dentada', categoryId: 'EMPILHADEIRAS', defaultMonths: 0, defaultKm: 2000, order: 2 },
  { id: 's21', name: 'Pneus traseiros', categoryId: 'EMPILHADEIRAS', defaultMonths: 0, defaultKm: 0, order: 3 },
  { id: 's22', name: 'Bateria', categoryId: 'EMPILHADEIRAS', defaultMonths: 24, defaultKm: 0, order: 4 },
  { id: 's23', name: 'Revisão periódica', categoryId: 'MOTOS', defaultMonths: 12, defaultKm: 10000, order: 0 },
  { id: 's24', name: 'Revisão', categoryId: 'GERADORES', defaultMonths: 12, defaultKm: 10000, order: 0 },
];


let VEHICLE_SERVICES: Omit<VehicleService, 'status' | 'nextDate' | 'nextKm'>[] = [
    // ONC 9390
    { id: 'vs1', vehicleId: 'v1', serviceId: 's1', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin' },
    { id: 'vs2', vehicleId: 'v1', serviceId: 's2', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin' },
    { id: 'vs3', vehicleId: 'v1', serviceId: 's3', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin' },
    { id: 'vs4', vehicleId: 'v1', serviceId: 's4', lastDate: parse('09/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 404995, supplier: 'CHIP TRUCK', responsible: 'Admin' },
    { id: 'vs5', vehicleId: 'v1', serviceId: 's5', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin' },
    { id: 'vs6', vehicleId: 'v1', serviceId: 's6', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin' },
    { id: 'vs7', vehicleId: 'v1', serviceId: 's7', lastDate: parse('19/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 404995, supplier: 'CHIP TRUCK', responsible: 'Admin' },
    { id: 'vs8', vehicleId: 'v1', serviceId: 's8', lastDate: parse('26/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 400000, supplier: 'Casa das Baterias', responsible: 'Admin' },
    { id: 'vs9', vehicleId: 'v1', serviceId: 's10', lastDate: parse('10/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 395000, supplier: 'JATAI EXTINTORES', responsible: 'Admin' },
    { id: 'vs10', vehicleId: 'v1', serviceId: 's11', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin' },
    { id: 'vs11', vehicleId: 'v1', serviceId: 's12', lastDate: parse('24/10/2025', 'dd/MM/yyyy', new Date()), lastKm: 410000, supplier: 'MINOL', responsible: 'Admin' },
    { id: 'vs12', vehicleId: 'v1', serviceId: 's13', lastDate: parse('01/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 370000, supplier: 'Interno', responsible: 'Admin' },
    // PQT 1H75
    { id: 'vs13', vehicleId: 'v2', serviceId: 's1', lastDate: parse('16/05/2025', 'dd/MM/yyyy', new Date()), lastKm: 327147, supplier: 'Interno', responsible: 'Admin' },
    { id: 'vs14', vehicleId: 'v2', serviceId: 's4', lastDate: parse('11/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 330000, supplier: 'CHIP TRUCK', responsible: 'Admin' },
    { id: 'vs15', vehicleId: 'v2', serviceId: 's5', lastDate: parse('09/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'FERNANDO', responsible: 'Admin' },
    { id: 'vs16', vehicleId: 'v2', serviceId: 's6', lastDate: parse('09/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'FERNANDO', responsible: 'Admin' },
    { id: 'vs17', vehicleId: 'v2', serviceId: 's7', lastDate: parse('11/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 330000, supplier: 'CHIP TRUCK', responsible: 'Admin' },
    { id: 'vs18', vehicleId: 'v2', serviceId: 's9', lastDate: parse('11/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 342078, supplier: 'DANIEL', responsible: 'Admin' },
    { id: 'vs19', vehicleId: 'v2', serviceId: 's12', lastDate: parse('30/10/2025', 'dd/MM/yyyy', new Date()), lastKm: 345000, supplier: 'MINOL NF 15849', responsible: 'Admin' },
    { id: 'vs20', vehicleId: 'v2', serviceId: 's13', lastDate: parse('01/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'Interno', responsible: 'Admin' },
    { id: 'vs21', vehicleId: 'v2', serviceId: 's14', lastDate: parse('11/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 342078, supplier: 'DANIEL', responsible: 'Admin' },
];


// --- MOCK DATABASE MUTATIONS ---
export async function mockDbUpdateVehicleKm(id: string, km: number) {
    const vehicleIndex = VEHICLES.findIndex(v => v.id === id);
    if (vehicleIndex !== -1) {
        VEHICLES[vehicleIndex].currentKm = km;
    }
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbAddVehicleService(data: Omit<VehicleService, 'id' | 'status' | 'nextDate' | 'nextKm'>) {
    const newService = {
        id: `vs${Date.now()}`,
        ...data,
    };
    VEHICLE_SERVICES.push(newService);
    await new Promise(res => setTimeout(res, 800));
}

export async function mockDbAddVehicle(data: { plate: string; currentKm: number; category: CategoryID }) {
    const newVehicle: Vehicle = {
        id: `v${Date.now()}`,
        plate: data.plate,
        currentKm: data.currentKm,
        category: data.category,
        active: true,
        photoUrl: `https://picsum.photos/seed/${data.plate}/600/400`,
    };
    VEHICLES.push(newVehicle);

    // Get all services for the category
    const categoryServices = SERVICES.filter(s => s.categoryId === data.category);
    
    // Add empty service history for the new vehicle
    categoryServices.forEach(service => {
        const newServiceRecord = {
            id: `vs${Date.now()}-${service.id}`,
            vehicleId: newVehicle.id,
            serviceId: service.id,
            // Use a far-past date and 0 km to indicate it's never been done
            lastDate: new Date('2000-01-01'), 
            lastKm: 0,
            supplier: '',
            responsible: 'Sistema',
        };
        VEHICLE_SERVICES.push(newServiceRecord);
    });

    await new Promise(res => setTimeout(res, 500));
}

// --- DATA PROCESSING LOGIC ---

/**
 * Calculates the status of a single service for a vehicle.
 */
function getServiceStatus(
  vehicle: Vehicle,
  service: Omit<VehicleService, 'status' | 'nextDate' | 'nextKm'>,
  serviceInfo: Service
): { status: ServiceStatus; nextDate: Date; nextKm: number } {
  const { lastDate, lastKm } = service;
  const { defaultMonths, defaultKm } = serviceInfo;
  const { currentKm } = vehicle;

  // If the service has never been performed, flag as ALERTA
  if (lastKm === 0 && lastDate.getFullYear() === 2000) {
    return {
        status: 'ALERTA',
        nextDate: new Date(),
        nextKm: currentKm,
    };
  }

  const nextDate = defaultMonths > 0 ? addMonths(lastDate, defaultMonths) : new Date('2999-12-31');
  const nextKm = defaultKm > 0 ? lastKm + defaultKm : Infinity;

  const daysUntilNextDate = differenceInDays(nextDate, new Date());
  const kmUntilNextService = nextKm - currentKm;

  let status: ServiceStatus = 'OK';
  const isKmAlert = defaultKm > 0 && kmUntilNextService <= defaultKm * 0.1; // 10% threshold
  const isDateAlert = defaultMonths > 0 && daysUntilNextDate <= 30; // 30 days threshold

  if ((defaultKm > 0 && currentKm >= nextKm) || (defaultMonths > 0 && new Date() >= nextDate)) {
    status = 'VENCIDO';
  } else if (isKmAlert || isDateAlert) {
    status = 'ALERTA';
  }

  return { status, nextDate, nextKm };
}


/**
 * Processes raw data to add status and next service info.
 */
export async function getDashboardData(userRole: UserRole): Promise<DashboardData> {
  const processedVehicleServices = VEHICLE_SERVICES.map((vs) => {
    const vehicle = VEHICLES.find(v => v.id === vs.vehicleId);
    const serviceInfo = SERVICES.find(s => s.id === vs.serviceId);
    if (!vehicle || !serviceInfo) {
      // This should not happen in a real app with foreign keys
      return {
        ...vs,
        status: 'OK',
        nextDate: new Date('2999-12-31'),
        nextKm: Infinity,
      } as VehicleService;
    }
    const { status, nextDate, nextKm } = getServiceStatus(vehicle, vs, serviceInfo);
    return { ...vs, status, nextDate, nextKm };
  });

  const vehiclesWithStatus: VehicleWithStatus[] = VEHICLES.filter(v => v.active).map((v) => {
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
        const aDays = differenceInDays(a.nextDate, new Date());
        const bDays = differenceInDays(b.nextDate, new Date());
        return aDays - bDays;
      })[0];

    if (nextDueService) {
        const serviceInfo = SERVICES.find(s => s.id === nextDueService.serviceId);
        const byKm = nextDueService.nextKm !== Infinity ? `${nextDueService.nextKm.toLocaleString('pt-BR')} km` : '';
        const byDate = nextDueService.nextDate < new Date('2999-01-01') ? `${nextDueService.nextDate.toLocaleDateString('pt-BR')}` : '';
        const separator = byKm && byDate ? ' ou ' : '';
        nextServiceSummary = `${serviceInfo?.name || 'Serviço'} em ${byKm}${separator}${byDate}`;
    }


    return { ...v, status: overallStatus, nextServiceSummary };
  });

  const categoriesWithStatus: CategoryWithStatus[] = CATEGORIES.map(cat => {
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
    services: SERVICES,
    vehicleServices: processedVehicleServices as VehicleService[],
    categories: categoriesWithStatus,
    userRole,
  };
}
