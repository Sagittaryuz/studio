'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { suggestMaintenanceSchedule as suggestMaintenanceScheduleFlow } from '@/ai/flows/suggest-maintenance-schedule';
import type { SuggestMaintenanceScheduleInput, SuggestMaintenanceScheduleOutput } from '@/ai/flows/suggest-maintenance-schedule';
import { mockDbAddVehicle, mockDbAddVehicleService, mockDbUpdateVehicleKm, mockDbUpdateVehicleServiceNotes, mockDbDeleteService, mockDbEditVehicle, mockDbAddOrUpdateService, mockDbUpdateServiceOrder, mockDbAddOrUpdateCategory } from '@/lib/data';
import type { Category, CategoryID, Service } from '@/lib/types';


// Re-exporting for component usage
export type { SuggestMaintenanceScheduleInput, SuggestMaintenanceScheduleOutput };


// --- FORM SCHEMAS ---
const updateKmSchema = z.object({
  vehicleId: z.string(),
  currentKm: z.number().positive(),
});

const addServiceSchema = z.object({
    vehicleId: z.string(),
    serviceId: z.string(),
    lastKm: z.number().positive(),
    lastDate: z.date(),
    supplier: z.string(),
    responsible: z.string(),
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    km: z.number().optional(),
    months: z.number().optional(),
});

const addVehicleSchema = z.object({
    plate: z.string().min(3, 'Placa inválida.'),
    currentKm: z.number().min(0, 'KM inválido.'),
    categoryId: z.string(),
    fleetNumber: z.string().optional(),
});

const editVehicleSchema = z.object({
    id: z.string(),
    plate: z.string().min(3, 'Placa inválida.'),
    currentKm: z.number().min(0, 'KM inválido.'),
    fleetNumber: z.string().optional(),
});


const updateNotesSchema = z.object({
  vehicleServiceId: z.string(),
  notes: z.string(),
});

const deleteServiceSchema = z.object({
  serviceId: z.string(),
});

const serviceFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'O nome do serviço deve ter pelo menos 2 caracteres.'),
  categoryId: z.string(),
  order: z.number(),
});

const categoryFormSchema = z.object({
    name: z.string().min(3, 'O nome da categoria deve ter pelo menos 3 caracteres.'),
});


// --- SERVER ACTIONS ---

/**
 * Updates the current mileage of a vehicle.
 */
export async function updateVehicleKm(vehicleId: string, currentKm: number) {
  const validation = updateKmSchema.safeParse({ vehicleId, currentKm });

  if (!validation.success) {
    throw new Error('Invalid input');
  }

  await mockDbUpdateVehicleKm(vehicleId, currentKm);
  
  revalidatePath('/');
  revalidatePath('/services');
}

/**
 * Adds a new maintenance record for a vehicle.
 */
export async function addVehicleService(data: z.infer<typeof addServiceSchema>) {
    const validation = addServiceSchema.safeParse(data);

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for adding service.');
    }

    await mockDbAddVehicleService(data);

    revalidatePath('/');
    revalidatePath(`/history/${data.vehicleId}/${data.serviceId}`);
    revalidatePath('/services');
}

/**
 * Adds a new vehicle to the fleet.
 */
export async function addVehicle(data: z.infer<typeof addVehicleSchema>) {
    const validation = addVehicleSchema.safeParse(data);

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for adding vehicle.');
    }
    
    await mockDbAddVehicle({
        plate: data.plate,
        currentKm: data.currentKm,
        category: data.categoryId as CategoryID,
        fleetNumber: data.fleetNumber,
    });

    revalidatePath('/');
    revalidatePath('/services');
}

/**
 * Edits an existing vehicle in the fleet.
 */
export async function editVehicle(data: z.infer<typeof editVehicleSchema>) {
    const validation = editVehicleSchema.safeParse(data);

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for editing vehicle.');
    }
    
    await mockDbEditVehicle(data.id, {
        plate: data.plate,
        currentKm: data.currentKm,
        fleetNumber: data.fleetNumber,
    });

    revalidatePath('/');
    revalidatePath('/services');
}

/**
 * Updates the notes for a specific vehicle service record.
 */
export async function updateVehicleServiceNotes(vehicleServiceId: string, notes: string) {
    const validation = updateNotesSchema.safeParse({ vehicleServiceId, notes });

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for updating notes.');
    }

    await mockDbUpdateVehicleServiceNotes(vehicleServiceId, notes);
    
    revalidatePath('/');
    revalidatePath('/services');
}

/**
 * Deletes a service type and all its associated vehicle service records.
 */
export async function deleteService(serviceId: string) {
    const validation = deleteServiceSchema.safeParse({ serviceId });

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for deleting service.');
    }
    
    await mockDbDeleteService(serviceId);

    revalidatePath('/');
    revalidatePath('/services');
}

/**
 * Adds or updates a service type.
 */
export async function addOrUpdateService(data: z.infer<typeof serviceFormSchema>) {
    const validation = serviceFormSchema.safeParse(data);

    if (!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for service.');
    }

    await mockDbAddOrUpdateService(data);
    revalidatePath('/services');
    revalidatePath('/');
}

/**
 * Updates the order of services.
 */
export async function updateServiceOrder(orderedServices: Service[]) {
    // Basic validation to ensure it's an array
    if (!Array.isArray(orderedServices)) {
        throw new Error('Invalid input for updating service order.');
    }
    
    await mockDbUpdateServiceOrder(orderedServices);
    revalidatePath('/services');
    revalidatePath('/');
}

/**
 * Adds or updates a category.
 */
export async function addOrUpdateCategory(data: z.infer<typeof categoryFormSchema>) {
    const validation = categoryFormSchema.safeParse(data);

    if (!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for category.');
    }

    const newCategory: Category = {
        id: data.name.toUpperCase().replace(/\s/g, '_') as CategoryID,
        name: data.name,
    };

    await mockDbAddOrUpdateCategory(newCategory);
    revalidatePath('/services');
    revalidatePath('/');
    return newCategory;
}


/**
 * Calls the Genkit flow to get a maintenance schedule suggestion.
 */
export async function suggestMaintenanceSchedule(
    input: SuggestMaintenanceScheduleInput
  ): Promise<SuggestMaintenanceScheduleOutput> {
    
    console.log(`[ACTION] Calling Genkit flow with input:`, input);
    // Here we call the actual AI flow.
    const result = await suggestMaintenanceScheduleFlow(input);
    
    return result;
}

export async function getSignedUploadUrl(fileName: string, contentType: string, size: number, checksum: string) {
  // In a real app, you'd use the Firebase Admin SDK here to create a signed URL.
  // This is a placeholder.
  console.log(`[Server Action] Generating signed URL for: ${fileName}, Type: ${contentType}, Size: ${size}, Checksum: ${checksum}`);
  const url = `https://fake-upload.url/for/${fileName}`;
  return { success: true, url };
}
