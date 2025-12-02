'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { suggestMaintenanceSchedule as suggestMaintenanceScheduleFlow } from '@/ai/flows/suggest-maintenance-schedule';
import type { SuggestMaintenanceScheduleInput, SuggestMaintenanceScheduleOutput } from '@/ai/flows/suggest-maintenance-schedule';
import { doc, setDoc, deleteDoc, writeBatch, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebaseAdmin } from '@/firebase/server-init';
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
    id: z.string().optional(),
    name: z.string().min(3, 'O nome da categoria deve ter pelo menos 3 caracteres.'),
});

const deleteCategorySchema = z.object({
  categoryId: z.string(),
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

  const { firestore } = initializeFirebaseAdmin();
  const vehicleRef = doc(firestore, 'vehicles', vehicleId);
  await setDoc(vehicleRef, { currentKm }, { merge: true });
  
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
    
    const { firestore } = initializeFirebaseAdmin();
    
    // Find if a vehicleService for this vehicle and service already exists
    const vsQuery = query(
        collection(firestore, 'vehicleServices'),
        where('vehicleId', '==', data.vehicleId),
        where('serviceId', '==', data.serviceId)
    );
    const querySnapshot = await getDocs(vsQuery);
    
    const vsDocRef = querySnapshot.docs.length > 0
        ? querySnapshot.docs[0].ref
        : doc(collection(firestore, 'vehicleServices'));

    await setDoc(vsDocRef, {
        id: vsDocRef.id,
        ...data,
        lastDate: data.lastDate.toISOString(), // Store as ISO string
    }, { merge: true });


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

    const { firestore } = initializeFirebaseAdmin();
    const newVehicleRef = doc(collection(firestore, 'vehicles'));

    await setDoc(newVehicleRef, {
        id: newVehicleRef.id,
        plate: data.plate,
        currentKm: data.currentKm,
        category: data.categoryId as CategoryID,
        fleetNumber: data.fleetNumber || '',
        active: true,
        photoUrl: `https://picsum.photos/seed/${newVehicleRef.id}/600/400`,
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
    
    const { firestore } = initializeFirebaseAdmin();
    const vehicleRef = doc(firestore, 'vehicles', data.id);

    await setDoc(vehicleRef, {
        plate: data.plate,
        currentKm: data.currentKm,
        fleetNumber: data.fleetNumber || '',
    }, { merge: true });

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

    const { firestore } = initializeFirebaseAdmin();
    const vsRef = doc(firestore, 'vehicleServices', vehicleServiceId);
    await setDoc(vsRef, { notes }, { merge: true });
    
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
    
    const { firestore } = initializeFirebaseAdmin();
    const batch = writeBatch(firestore);

    // 1. Delete the service document itself
    const serviceRef = doc(firestore, 'services', serviceId);
    batch.delete(serviceRef);

    // 2. Find and delete all associated vehicleService documents
    const vsQuery = query(collection(firestore, 'vehicleServices'), where('serviceId', '==', serviceId));
    const vsSnapshot = await getDocs(vsQuery);
    vsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();

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

    const { firestore } = initializeFirebaseAdmin();
    const serviceRef = data.id 
        ? doc(firestore, 'services', data.id)
        : doc(collection(firestore, 'services'));
    
    await setDoc(serviceRef, {
        id: serviceRef.id,
        ...data,
    }, { merge: true });

    revalidatePath('/services');
    revalidatePath('/');
}

/**
 * Updates the order of services.
 */
export async function updateServiceOrder(orderedServices: Service[]) {
    if (!Array.isArray(orderedServices)) {
        throw new Error('Invalid input for updating service order.');
    }
    
    const { firestore } = initializeFirebaseAdmin();
    const batch = writeBatch(firestore);

    orderedServices.forEach(service => {
        const serviceRef = doc(firestore, 'services', service.id);
        batch.update(serviceRef, { order: service.order });
    });

    await batch.commit();

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
    
    const { firestore } = initializeFirebaseAdmin();

    let categoryId = data.id;
    let newCategory: Omit<Category, 'id'> & { id?: string };
    let categoryRef;

    if (data.id) { // Editing
        categoryRef = doc(firestore, 'categories', data.id);
        await setDoc(categoryRef, { name: data.name }, { merge: true });
        newCategory = { name: data.name }; // To get full object back
    } else { // Adding
        categoryId = data.name.toUpperCase().replace(/\s/g, '_');
        categoryRef = doc(firestore, 'categories', categoryId);
        
        // Get max order to append the new one
        const maxOrderQuery = query(collection(firestore, 'categories'));
        const querySnapshot = await getDocs(maxOrderQuery);
        const maxOrder = Math.max(-1, ...querySnapshot.docs.map(doc => doc.data().order ?? -1));

        newCategory = {
            id: categoryId,
            name: data.name,
            order: maxOrder + 1,
        };
        await setDoc(categoryRef, newCategory);
    }
    
    revalidatePath('/services');
    revalidatePath('/');

    // Return the full category object so the client can update its state
    const savedDocSnapshot = await getDocs(query(collection(firestore, 'categories'), where('name', '==', data.name)));
    if (savedDocSnapshot.empty) {
        // This case is for an edit where we don't have the full object yet.
        // We just return what we know, client must merge.
        return { ...newCategory, id: categoryId } as Category;
    }
    return { ...savedDocSnapshot.docs[0].data(), id: savedDocSnapshot.docs[0].id } as Category;
}

/**
 * Updates the order of categories.
 */
export async function updateCategoryOrder(orderedCategories: Category[]) {
    if (!Array.isArray(orderedCategories)) {
        throw new Error('Invalid input for updating category order.');
    }
    
    const { firestore } = initializeFirebaseAdmin();
    const batch = writeBatch(firestore);

    orderedCategories.forEach((category, index) => {
        const categoryRef = doc(firestore, 'categories', category.id);
        batch.update(categoryRef, { order: index });
    });

    await batch.commit();

    revalidatePath('/services');
    revalidatePath('/');
}

/**
 * Deletes a category and all its associated services and vehicle services.
 */
export async function deleteCategory(categoryId: string) {
    const validation = deleteCategorySchema.safeParse({ categoryId });

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for deleting category.');
    }
    
    const { firestore } = initializeFirebaseAdmin();
    const batch = writeBatch(firestore);

    // 1. Delete the category document itself
    const categoryRef = doc(firestore, 'categories', categoryId);
    batch.delete(categoryRef);

    // 2. Find and delete all services in this category
    const servicesQuery = query(collection(firestore, 'services'), where('categoryId', '==', categoryId));
    const servicesSnapshot = await getDocs(servicesQuery);
    
    const serviceIdsToDelete = servicesSnapshot.docs.map(d => d.id);
    servicesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    // 3. Find and delete all vehicleService documents associated with the services being deleted
    if (serviceIdsToDelete.length > 0) {
        // Firestore 'in' query can take up to 30 items. If more, we need to batch the queries.
        const CHUNK_SIZE = 30;
        for (let i = 0; i < serviceIdsToDelete.length; i += CHUNK_SIZE) {
            const chunk = serviceIdsToDelete.slice(i, i + CHUNK_SIZE);
            const vsQuery = query(collection(firestore, 'vehicleServices'), where('serviceId', 'in', chunk));
            const vsSnapshot = await getDocs(vsQuery);
            vsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
    }

    await batch.commit();

    revalidatePath('/');
    revalidatePath('/services');
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
