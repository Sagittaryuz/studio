

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

let CATEGORIES: Category[] = [
  { id: 'LOGISTICO', name: 'Logístico' },
  { id: 'EMPILHADEIRAS', name: 'Empilhadeiras' },
  { id: 'PASSEIO', name: 'Passeio' },
  { id: 'MOTOS', name: 'Motos' },
  { id: 'GERADORES', name: 'Geradores' },
];

let VEHICLES: Vehicle[] = [
  { id: 'v1', fleetNumber: '101', plate: 'ONC 9390', category: 'LOGISTICO', currentKm: 404714, active: true, photoUrl: 'https://picsum.photos/seed/truck1/600/400' },
  { id: 'v2', fleetNumber: '102', plate: 'PQT 1H75', category: 'LOGISTICO', currentKm: 343000, active: true, photoUrl: 'https://picsum.photos/seed/truck2/600/400' },
  { id: 'v3', fleetNumber: '103', plate: 'RBU 9C38', category: 'LOGISTICO', currentKm: 178315, active: true, photoUrl: 'https://picsum.photos/seed/truck3/600/400' },
  { id: 'v4', fleetNumber: '104', plate: 'RCB 0E98', category: 'LOGISTICO', currentKm: 184786, active: true, photoUrl: 'https://picsum.photos/seed/truck4/600/400' },
  { id: 'v5', fleetNumber: '105', plate: 'SCX 0J04', category: 'LOGISTICO', currentKm: 116000, active: true, photoUrl: 'https://picsum.photos/seed/truck5/600/400' },
  { id: 'v6', fleetNumber: '106', plate: 'SCP 5J36', category: 'LOGISTICO', currentKm: 108000, active: true, photoUrl: 'https://picsum.photos/seed/truck6/600/400' },
  { id: 'v7', fleetNumber: '107', plate: 'OGS 8583', category: 'LOGISTICO', currentKm: 225000, active: true, photoUrl: 'https://picsum.photos/seed/truck7/600/400' },
  { id: 'v8', fleetNumber: '108', plate: 'RBS 5E06', category: 'LOGISTICO', currentKm: 72255, active: true, photoUrl: 'https://picsum.photos/seed/truck8/600/400' },
  { id: 'v9', fleetNumber: '109', plate: 'NWO 8655', category: 'LOGISTICO', currentKm: 3, active: true, photoUrl: 'https://picsum.photos/seed/truck9/600/400' },
  { id: 'v10', fleetNumber: '110', plate: 'OGS 8G13', category: 'LOGISTICO', currentKm: 193000, active: true, photoUrl: 'https://picsum.photos/seed/truck10/600/400' },
  { id: 'v11', fleetNumber: '111', plate: 'PQH 4780', category: 'LOGISTICO', currentKm: 113000, active: true, photoUrl: 'https://picsum.photos/seed/truck11/600/400' },
  { id: 'v12', fleetNumber: '112', plate: 'SCY 3I97', category: 'LOGISTICO', currentKm: 40350, active: true, photoUrl: 'https://picsum.photos/seed/truck12/600/400' },
  { id: 'v13', fleetNumber: '113', plate: 'PQE 3070', category: 'LOGISTICO', currentKm: 135300, active: true, photoUrl: 'https://picsum.photos/seed/truck13/600/400' },
  { id: 'v14', fleetNumber: '114', plate: 'NVO 8161', category: 'LOGISTICO', currentKm: 303676, active: true, photoUrl: 'https://picsum.photos/seed/truck14/600/400' },
  { id: 'v15', fleetNumber: '115', plate: 'ONC 9190', category: 'LOGISTICO', currentKm: 197000, active: true, photoUrl: 'https://picsum.photos/seed/truck15/600/400' },

  { id: 'v16', fleetNumber: 'E-182', plate: 'HYSTER 60XT - 182', category: 'EMPILHADEIRAS', currentKm: 1300, active: true, photoUrl: 'https://picsum.photos/seed/forklift1/600/400' },
  { id: 'v17', fleetNumber: 'E-75', plate: 'HYSTER 60FT - 75', category: 'EMPILHADEIRAS', currentKm: 14600, active: true, photoUrl: 'https://picsum.photos/seed/forklift2/600/400' },
  { id: 'v18', fleetNumber: 'E-168', plate: 'HYSTER 60XT - 168', category: 'EMPILHADEIRAS', currentKm: 7039, active: true, photoUrl: 'https://picsum.photos/seed/forklift3/600/400' },
  { id: 'v19', fleetNumber: 'E-76', plate: 'HYSTER 55XM - 76', category: 'EMPILHADEIRAS', currentKm: 139, active: true, photoUrl: 'https://picsum.photos/seed/forklift4/600/400' },
  { id: 'v20', fleetNumber: 'E-132', plate: 'CLARK GTS30 - 132', category: 'EMPILHADEIRAS', currentKm: 10568, active: true, photoUrl: 'https://picsum.photos/seed/forklift5/600/400' },
  { id: 'v21', fleetNumber: 'E-179', plate: 'TLC30 DIESEL - 179', category: 'EMPILHADEIRAS', currentKm: 1300, active: true, photoUrl: 'https://picsum.photos/seed/forklift6/600/400' },
  { id: 'v22', fleetNumber: 'E-153', plate: 'STILL FMX17 - 153', category: 'EMPILHADEIRAS', currentKm: 2000, active: true, photoUrl: 'https://picsum.photos/seed/forklift7/600/400' },
  { id: 'v23', fleetNumber: 'E-154', plate: 'STILL FMX17 - 154', category: 'EMPILHADEIRAS', currentKm: 1850, active: true, photoUrl: 'https://picsum.photos/seed/forklift8/600/400' },
  { id: 'v24', fleetNumber: 'E-108', plate: 'CLARK C30 - 108', category: 'EMPILHADEIRAS', currentKm: 8150, active: true, photoUrl: 'https://picsum.photos/seed/forklift9/600/400' },
  { id: 'v25', fleetNumber: 'E-161', plate: 'STILL EGV16 - 161', category: 'EMPILHADEIRAS', currentKm: 1000, active: true, photoUrl: 'https://picsum.photos/seed/forklift10/600/400' },
  { id: 'v26', fleetNumber: 'E-181', plate: 'HYSTER 60XT - 181', category: 'EMPILHADEIRAS', currentKm: 2350, active: true, photoUrl: 'https://picsum.photos/seed/forklift11/600/400' },
  { id: 'v27', fleetNumber: 'E-122', plate: 'CLARK C30 - 122', category: 'EMPILHADEIRAS', currentKm: 7700, active: true, photoUrl: 'https://picsum.photos/seed/forklift12/600/400' },
  { id: 'v28', fleetNumber: 'E-165', plate: 'STILL EGV16 - 165', category: 'EMPILHADEIRAS', currentKm: 1400, active: true, photoUrl: 'https://picsum.photos/seed/forklift13/600/400' },

  { id: 'v29', fleetNumber: 'P-01', plate: 'PQR 3H80', category: 'PASSEIO', currentKm: 250000, active: true, photoUrl: 'https://picsum.photos/seed/car1/600/400' },
  { id: 'v30', fleetNumber: 'P-02', plate: 'RBO 1C73', category: 'PASSEIO', currentKm: 44000, active: true, photoUrl: 'https://picsum.photos/seed/car2/600/400' },
  { id: 'v31', fleetNumber: 'P-03', plate: 'RBO 1C93', category: 'PASSEIO', currentKm: 28650, active: true, photoUrl: 'https://picsum.photos/seed/car3/600/400' },
  { id: 'v32', fleetNumber: 'P-04', plate: 'SCN 5C62', category: 'PASSEIO', currentKm: 37500, active: true, photoUrl: 'https://picsum.photos/seed/car4/600/400' },
  { id: 'v33', fleetNumber: 'P-05', plate: 'SCH 3I62', category: 'PASSEIO', currentKm: 67865, active: true, photoUrl: 'https://picsum.photos/seed/car5/600/400' },
  { id: 'v34', fleetNumber: 'P-06', plate: 'PQE 9370', category: 'PASSEIO', currentKm: 106200, active: true, photoUrl: 'https://picsum.photos/seed/car6/600/400' },
  { id: 'v35', fleetNumber: 'P-07', plate: 'SDC 3A35', category: 'PASSEIO', currentKm: 51000, active: true, photoUrl: 'https://picsum.photos/seed/car7/600/400' },
  { id: 'v36', fleetNumber: 'P-08', plate: 'SCQ 2H05', category: 'PASSEIO', currentKm: 13000, active: true, photoUrl: 'https://picsum.photos/seed/car8/600/400' },
  { id: 'v37', fleetNumber: 'P-09', plate: 'SDL 3D58', category: 'PASSEIO', currentKm: 1, active: true, photoUrl: 'https://picsum.photos/seed/car9/600/400' },
  { id: 'v38', fleetNumber: 'P-10', plate: 'SDN 3G91', category: 'PASSEIO', currentKm: 1, active: true, photoUrl: 'https://picsum.photos/seed/car10/600/400' },

  { id: 'v39', fleetNumber: 'M-01', plate: 'ONQ 8222', category: 'MOTOS', currentKm: 57400, active: true, photoUrl: 'https://picsum.photos/seed/bike1/600/400' },
  { id: 'v40', fleetNumber: 'M-02', plate: 'RCA 5I35', category: 'MOTOS', currentKm: 25000, active: true, photoUrl: 'https://picsum.photos/seed/bike2/600/400' },
  { id: 'v41', fleetNumber: 'M-03', plate: 'OMJ 7E43', category: 'MOTOS', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/bike3/600/400' },
  { id: 'v42', fleetNumber: 'M-04', plate: 'RCL 6I62', category: 'MOTOS', currentKm: 9439, active: true, photoUrl: 'https://picsum.photos/seed/bike4/600/400' },
  { id: 'v43', fleetNumber: 'M-05', plate: 'ONQ 5462', category: 'MOTOS', currentKm: 71175, active: true, photoUrl: 'https://picsum.photos/seed/bike5/600/400' },
  { id: 'v44', fleetNumber: 'M-06', plate: 'NGL8763', category: 'MOTOS', currentKm: 53100, active: true, photoUrl: 'https://picsum.photos/seed/bike6/600/400' },

  { id: 'v45', fleetNumber: 'G-86', plate: '86 - MATRIZ', category: 'GERADORES', currentKm: 393, active: true, photoUrl: 'https://picsum.photos/seed/generator1/600/400' },
  { id: 'v46', fleetNumber: 'G-111', plate: '111 - CD', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator2/600/400' },
  { id: 'v47', fleetNumber: 'G-87', plate: '87 - CATEDRAL', category: 'GERADORES', currentKm: 393, active: true, photoUrl: 'https://picsum.photos/seed/generator3/600/400' },
  { id: 'v48', fleetNumber: 'G-112', plate: '112 - MINEIROS', category: 'GERADORES', currentKm: 187, active: true, photoUrl: 'https://picsum.photos/seed/generator4/600/400' },
  { id: 'v49', fleetNumber: 'G-148', plate: '148 - RHARO', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator5/600/400' },
  { id: 'v50', fleetNumber: 'G-162', plate: '162 - SAID ABDALLA', category: 'GERADORES', currentKm: 0, active: true, photoUrl: 'https://picsum.photos/seed/generator6/600/400' },
  { id: 'v51', fleetNumber: 'G-98', plate: '98 - RIO VERDE', category: 'GERADORES', currentKm: 13, active: true, photoUrl: 'https://picsum.photos/seed/generator7/600/400' },
];


let SERVICES: Service[] = [
  { id: 's1', name: 'Óleo do motor', categoryId: 'LOGISTICO', order: 0 },
  { id: 's2', name: 'Filtro de diesel', categoryId: 'LOGISTICO', order: 1 },
  { id: 's3', name: 'Filtro separador de água', categoryId: 'LOGISTICO', order: 2 },
  { id: 's4', name: 'Filtro de arla', categoryId: 'LOGISTICO', order: 3 },
  { id: 's5', name: 'Óleo do câmbio', categoryId: 'LOGISTICO', order: 4 },
  { id: 's6', name: 'Óleo do diferencial', categoryId: 'LOGISTICO', order: 5 },
  { id: 's7', name: 'Revisão do sistema de arla', categoryId: 'LOGISTICO', order: 6 },
  { id: 's8', name: 'Rodizio de baterias', categoryId: 'LOGISTICO', order: 7 },
  { id: 's9', name: 'Lubrificação', categoryId: 'LOGISTICO', order: 8 },
  { id: 's10', name: 'Extintor', categoryId: 'LOGISTICO', order: 9 },
  { id: 's11', name: 'Revisão da suspensão, cubos, rodas e freios', categoryId: 'LOGISTICO', order: 10 },
  { id: 's12', name: 'Radiador, intercooler e bloco do motor', categoryId: 'LOGISTICO', order: 11 },
  { id: 's13', name: 'Tacógrafo', categoryId: 'LOGISTICO', order: 12 },
  { id: 's14', name: 'Alinhamento', categoryId: 'LOGISTICO', order: 13 },
  { id: 's15', name: 'Regulagem de válvulas', categoryId: 'LOGISTICO', order: 14 },
  { id: 's16', name: 'Óleo do motor e filtros', categoryId: 'PASSEIO', order: 0 },
  { id: 's17', name: 'Óleo da transmissão', categoryId: 'PASSEIO', order: 1 },
  { id: 's18', name: 'Óleo do motor PSI', categoryId: 'EMPILHADEIRAS', order: 0 },
  { id: 's19', name: 'Óleo hidraulico', categoryId: 'EMPILHADEIRAS', order: 1 },
  { id: 's20', name: 'Correia dentada', categoryId: 'EMPILHADEIRAS', order: 2 },
  { id: 's21', name: 'Pneus traseiros', categoryId: 'EMPILHADEIRAS', order: 3 },
  { id: 's22', name: 'Bateria', categoryId: 'EMPILHADEIRAS', order: 4 },
  { id: 's23', name: 'Revisão periódica', categoryId: 'MOTOS', order: 0 },
  { id: 's24', name: 'Revisão', categoryId: 'GERADORES', order: 0 },
];


let VEHICLE_SERVICES: Omit<VehicleService, 'status' | 'nextDate' | 'nextKm'>[] = [
    // ONC 9390
    { id: 'vs1', vehicleId: 'v1', serviceId: 's1', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin', km: 20000, months: 12 },
    { id: 'vs2', vehicleId: 'v1', serviceId: 's2', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin', km: 10000, months: 6 },
    { id: 'vs3', vehicleId: 'v1', serviceId: 's3', lastDate: parse('03/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 392365, supplier: 'Interno', responsible: 'Admin', km: 10000, months: 6 },
    { id: 'vs4', vehicleId: 'v1', serviceId: 's4', lastDate: parse('09/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 404995, supplier: 'CHIP TRUCK', responsible: 'Admin', km: 40000, months: 18 },
    { id: 'vs5', vehicleId: 'v1', serviceId: 's5', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin', km: 60000, months: 18 },
    { id: 'vs6', vehicleId: 'v1', serviceId: 's6', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin', km: 60000, months: 18 },
    { id: 'vs7', vehicleId: 'v1', serviceId: 's7', lastDate: parse('19/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 404995, supplier: 'CHIP TRUCK', responsible: 'Admin', km: 180000, months: 72 },
    { id: 'vs8', vehicleId: 'v1', serviceId: 's8', lastDate: parse('26/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 400000, supplier: 'Casa das Baterias', responsible: 'Admin', km: 0, months: 3 },
    { id: 'vs9', vehicleId: 'v1', serviceId: 's10', lastDate: parse('10/06/2025', 'dd/MM/yyyy', new Date()), lastKm: 395000, supplier: 'JATAI EXTINTORES', responsible: 'Admin', km: 0, months: 58 },
    { id: 'vs10', vehicleId: 'v1', serviceId: 's11', lastDate: parse('20/08/2024', 'dd/MM/yyyy', new Date()), lastKm: 380000, supplier: 'DANIEL', responsible: 'Admin', km: 0, months: 14 },
    { id: 'vs11', vehicleId: 'v1', serviceId: 's12', lastDate: parse('24/10/2025', 'dd/MM/yyyy', new Date()), lastKm: 410000, supplier: 'MINOL', responsible: 'Admin', km: 0, months: 24 },
    { id: 'vs12', vehicleId: 'v1', serviceId: 's13', lastDate: parse('01/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 370000, supplier: 'Interno', responsible: 'Admin', km: 0, months: 24 },
    // PQT 1H75
    { id: 'vs13', vehicleId: 'v2', serviceId: 's1', lastDate: parse('16/05/2025', 'dd/MM/yyyy', new Date()), lastKm: 327147, supplier: 'Interno', responsible: 'Admin', km: 20000, months: 12 },
    { id: 'vs14', vehicleId: 'v2', serviceId: 's4', lastDate: parse('11/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 330000, supplier: 'CHIP TRUCK', responsible: 'Admin', km: 40000, months: 18 },
    { id: 'vs15', vehicleId: 'v2', serviceId: 's5', lastDate: parse('09/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'FERNANDO', responsible: 'Admin', km: 60000, months: 18 },
    { id: 'vs16', vehicleId: 'v2', serviceId: 's6', lastDate: parse('09/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'FERNANDO', responsible: 'Admin', km: 60000, months: 18 },
    { id: 'vs17', vehicleId: 'v2', serviceId: 's7', lastDate: parse('11/08/2025', 'dd/MM/yyyy', new Date()), lastKm: 330000, supplier: 'CHIP TRUCK', responsible: 'Admin', km: 180000, months: 72 },
    { id: 'vs18', vehicleId: 'v2', serviceId: 's9', lastDate: parse('11/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 342078, supplier: 'DANIEL', responsible: 'Admin', km: 2500, months: 1 },
    { id: 'vs19', vehicleId: 'v2', serviceId: 's12', lastDate: parse('30/10/2025', 'dd/MM/yyyy', new Date()), lastKm: 345000, supplier: 'MINOL NF 15849', responsible: 'Admin', km: 0, months: 24 },
    { id: 'vs20', vehicleId: 'v2', serviceId: 's13', lastDate: parse('01/07/2024', 'dd/MM/yyyy', new Date()), lastKm: 310000, supplier: 'Interno', responsible: 'Admin', km: 0, months: 24 },
    { id: 'vs21', vehicleId: 'v2', serviceId: 's14', lastDate: parse('11/09/2025', 'dd/MM/yyyy', new Date()), lastKm: 342078, supplier: 'DANIEL', responsible: 'Admin', km: 15000, months: 6 },
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
    // Find if a record for this vehicle and service already exists
    const existingServiceIndex = VEHICLE_SERVICES.findIndex(
        vs => vs.vehicleId === data.vehicleId && vs.serviceId === data.serviceId
    );

    if (existingServiceIndex !== -1) {
        // Update the existing record
        VEHICLE_SERVICES[existingServiceIndex] = {
            ...VEHICLE_SERVICES[existingServiceIndex],
            ...data,
        };
    } else {
        // Add a new record
        const newService = {
            id: `vs${Date.now()}`,
            ...data,
        };
        VEHICLE_SERVICES.push(newService);
    }
    
    await new Promise(res => setTimeout(res, 800));
}

export async function mockDbUpdateVehicleServiceNotes(id: string, notes: string) {
    const serviceIndex = VEHICLE_SERVICES.findIndex(vs => vs.id === id);
    if (serviceIndex !== -1) {
        VEHICLE_SERVICES[serviceIndex].notes = notes;
    }
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbAddVehicle(data: { plate: string; currentKm: number; category: CategoryID; fleetNumber?: string; }) {
    const newVehicle: Vehicle = {
        id: `v${Date.now()}`,
        plate: data.plate,
        currentKm: data.currentKm,
        category: data.category,
        fleetNumber: data.fleetNumber,
        active: true,
        photoUrl: `https://picsum.photos/seed/${data.plate}/600/400`,
    };
    VEHICLES.push(newVehicle);
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbEditVehicle(id: string, data: { plate: string; currentKm: number; fleetNumber?: string; }) {
    const vehicleIndex = VEHICLES.findIndex(v => v.id === id);
    if (vehicleIndex !== -1) {
        VEHICLES[vehicleIndex] = { ...VEHICLES[vehicleIndex], ...data };
    }
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbDeleteService(id: string) {
    const serviceIndex = SERVICES.findIndex(s => s.id === id);
    if (serviceIndex !== -1) {
        SERVICES.splice(serviceIndex, 1);
        // Also remove related vehicle services
        VEHICLE_SERVICES = VEHICLE_SERVICES.filter(vs => vs.serviceId !== id);
    }
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbAddOrUpdateService(service: Partial<Service>) {
    if (service.id) {
        const index = SERVICES.findIndex(s => s.id === service.id);
        if (index !== -1) {
            SERVICES[index] = { ...SERVICES[index], ...service as Service };
        }
    } else {
        const newService: Service = {
            id: `s${Date.now()}`,
            name: service.name!,
            categoryId: service.categoryId!,
            order: service.order!,
        };
        SERVICES.push(newService);
    }
    await new Promise(res => setTimeout(res, 500));
}

export async function mockDbUpdateServiceOrder(orderedServices: Service[]) {
    orderedServices.forEach(serviceToUpdate => {
        const index = SERVICES.findIndex(s => s.id === serviceToUpdate.id);
        if (index !== -1) {
            SERVICES[index].order = serviceToUpdate.order;
        }
    });
    await new Promise(res => setTimeout(res, 500));
}


export async function mockDbAddOrUpdateCategory(category: Category) {
    const index = CATEGORIES.findIndex(c => c.id === category.id);
    if (index === -1) {
        CATEGORIES.push(category);
    }
    // No update for now, as ID is derived from name.
    await new Promise(res => setTimeout(res, 500));
}

// --- DATA PROCESSING LOGIC ---

/**
 * Calculates the status of a single service for a vehicle.
 */
function getServiceStatus(
  vehicle: Vehicle,
  service: Omit<VehicleService, 'status' | 'nextDate' | 'nextKm'>,
): { status: ServiceStatus; nextDate: Date; nextKm: number } {
  const { lastDate, lastKm, months, km } = service;
  const { currentKm } = vehicle;

  // If the service has never been performed, flag as ALERTA
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
 * Processes raw data to add status and next service info.
 */
export async function getDashboardData(userRole: UserRole): Promise<DashboardData> {
  const processedVehicleServices = VEHICLE_SERVICES.map((vs) => {
    const vehicle = VEHICLES.find(v => v.id === vs.vehicleId);
    if (!vehicle) {
      // This should not happen in a real app with foreign keys
      return {
        ...vs,
        status: 'OK',
        nextDate: new Date('2999-12-31'),
        nextKm: Infinity,
      } as VehicleService;
    }
    const { status, nextDate, nextKm } = getServiceStatus(vehicle, vs);
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
    services: [...SERVICES],
    vehicleServices: processedVehicleServices as VehicleService[],
    categories: categoriesWithStatus,
    userRole,
  };
}
