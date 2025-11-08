'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { suggestMaintenanceSchedule as suggestMaintenanceScheduleFlow } from '@/ai/flows/suggest-maintenance-schedule';
import type { SuggestMaintenanceScheduleInput, SuggestMaintenanceScheduleOutput } from '@/ai/flows/suggest-maintenance-schedule';


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
});


// --- MOCK DATABASE MUTATIONS ---
// In a real app, these would interact with Firestore

async function mockDbUpdateVehicleKm(id: string, km: number) {
    console.log(`[ACTION] Updating vehicle ${id} to ${km} km.`);
    // Simulate DB delay
    await new Promise(res => setTimeout(res, 500));
    // In a real app: await db.collection('vehicles').doc(id).update({ currentKm: km });
}

async function mockDbAddVehicleService(data: z.infer<typeof addServiceSchema>) {
    console.log(`[ACTION] Adding service for vehicle ${data.vehicleId}:`, data);
    // Simulate DB delay
    await new Promise(res => setTimeout(res, 800));
    // In a real app: await db.collection('vehicleServices').add({ ...data, createdAt: serverTimestamp() });
}

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
