
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getStorage } from 'firebase-admin/storage';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import type { Category, CategoryID, Service } from '@/lib/types';


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
    cost: z.coerce.number().min(0).optional(),
    warrantyDate: z.date().optional(),
    notes: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    km: z.number().optional(),
    months: z.number().optional(),
});

const addCorrectiveServiceSchema = z.object({
  vehicleId: z.string(),
  serviceName: z.string().min(1, "O nome do serviço é obrigatório."),
  date: z.date(),
  cost: z.coerce.number().min(0, "O custo não pode ser negativo."),
  supplier: z.string().min(1, "O fornecedor é obrigatório."),
  warrantyDate: z.date().optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
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


const updateVehicleNotesSchema = z.object({
  vehicleId: z.string(),
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
 * Generates a signed URL for uploading a file to Firebase Storage.
 */
export async function getSignedUploadUrl(filePath: string, contentType: string) {
    const { app } = await initializeFirebaseAdmin();
    const bucket = getStorage(app).bucket();
    const file = bucket.file(filePath);

    try {
        const [url] = await file.getSignedUrl({
            version: 'v4',
            action: 'write',
            expires: Date.now() + 15 * 60 * 1000, // 15 minutes
            contentType,
        });
        
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        return { success: true, uploadUrl: url, publicUrl: publicUrl };
    } catch (error) {
        console.error('Error getting signed URL', error);
        return { success: false, error: 'Could not get signed URL.' };
    }
}


/**
 * Updates the current mileage of a vehicle.
 */
export async function updateVehicleKm(vehicleId: string, currentKm: number) {
  const validation = updateKmSchema.safeParse({ vehicleId, currentKm });

  if (!validation.success) {
    throw new Error('Invalid input');
  }

  const { firestore } = await initializeFirebaseAdmin();
  const vehicleRef = firestore.doc(`vehicles/${vehicleId}`);
  await vehicleRef.set({ currentKm }, { merge: true });
  
  revalidatePath('/');
  revalidatePath('/services');
  revalidatePath('/plan');
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
    
    const { firestore } = await initializeFirebaseAdmin();
    
    const vsQuery = firestore.collection('vehicleServices')
        .where('vehicleId', '==', data.vehicleId)
        .where('serviceId', '==', data.serviceId);
    
    const querySnapshot = await vsQuery.get();
    
    const vsDocRef = querySnapshot.docs.length > 0
        ? querySnapshot.docs[0].ref
        : firestore.collection('vehicleServices').doc();
    
    const dataToSave = {
        ...data,
        id: vsDocRef.id,
        lastDate: data.lastDate.toISOString(),
        warrantyDate: data.warrantyDate ? data.warrantyDate.toISOString() : null,
    };

    await vsDocRef.set(dataToSave, { merge: true });

    revalidatePath('/');
    revalidatePath(`/history/${data.vehicleId}/${data.serviceId}`);
    revalidatePath('/services');
    revalidatePath('/plan');
}

/**
 * Adds a new corrective maintenance record for a vehicle.
 */
export async function addCorrectiveService(data: z.infer<typeof addCorrectiveServiceSchema>) {
    const validation = addCorrectiveServiceSchema.safeParse(data);
    if (!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for adding corrective service.');
    }

    const { firestore } = await initializeFirebaseAdmin();
    const newRecordRef = firestore.collection('correctiveServiceRecords');

    await newRecordRef.add({
        ...data,
        date: data.date.toISOString(),
        warrantyDate: data.warrantyDate ? data.warrantyDate.toISOString() : null,
        createdAt: new Date().toISOString(),
    });

    revalidatePath('/plan');
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

    const { firestore } = await initializeFirebaseAdmin();
    const newVehicleRef = firestore.collection('vehicles').doc();

    await newVehicleRef.set({
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
    revalidatePath('/plan');
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
    
    const { firestore } = await initializeFirebaseAdmin();
    const vehicleRef = firestore.doc(`vehicles/${data.id}`);

    await vehicleRef.set({
        plate: data.plate,
        currentKm: data.currentKm,
        fleetNumber: data.fleetNumber || '',
    }, { merge: true });

    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/plan');
}

/**
 * Updates the notes for a specific vehicle.
 */
export async function updateVehicleNotes(vehicleId: string, notes: string) {
    const validation = updateVehicleNotesSchema.safeParse({ vehicleId, notes });

    if(!validation.success) {
        console.error(validation.error);
        throw new Error('Invalid input for updating notes.');
    }

    const { firestore } = await initializeFirebaseAdmin();
    const vsRef = firestore.doc(`vehicles/${vehicleId}`);
    await vsRef.set({ notes }, { merge: true });
    
    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/plan');
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
    
    const { firestore } = await initializeFirebaseAdmin();
    const batch = firestore.batch();

    const serviceRef = firestore.doc(`services/${serviceId}`);
    batch.delete(serviceRef);

    const vsQuery = firestore.collection('vehicleServices').where('serviceId', '==', serviceId);
    const vsSnapshot = await vsQuery.get();
    vsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();

    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/plan');
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

    const { firestore } = await initializeFirebaseAdmin();
    const serviceRef = data.id 
        ? firestore.doc(`services/${data.id}`)
        : firestore.collection('services').doc();
    
    await serviceRef.set({
        id: serviceRef.id,
        ...data,
    }, { merge: true });

    revalidatePath('/services');
    revalidatePath('/');
    revalidatePath('/plan');
}

/**
 * Updates the order of services.
 */
export async function updateServiceOrder(orderedServices: Service[]) {
    if (!Array.isArray(orderedServices)) {
        throw new Error('Invalid input for updating service order.');
    }
    
    const { firestore } = await initializeFirebaseAdmin();
    const batch = firestore.batch();

    orderedServices.forEach(service => {
        const serviceRef = firestore.doc(`services/${service.id}`);
        batch.update(serviceRef, { order: service.order });
    });

    await batch.commit();

    revalidatePath('/services');
    revalidatePath('/');
    revalidatePath('/plan');
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
    
    const { firestore } = await initializeFirebaseAdmin();

    let categoryId = data.id;
    let newCategory: Omit<Category, 'id'> & { id?: string };
    let categoryRef;

    if (data.id) { // Editing
        categoryRef = firestore.doc(`categories/${data.id}`);
        await categoryRef.set({ name: data.name }, { merge: true });
        newCategory = { name: data.name };
    } else { // Adding
        categoryId = data.name.toUpperCase().replace(/\s/g, '_');
        categoryRef = firestore.doc(`categories/${categoryId}`);
        
        const q = firestore.collection('categories');
        const querySnapshot = await q.get();
        const maxOrder = Math.max(-1, ...querySnapshot.docs.map(doc => doc.data().order ?? -1));

        newCategory = {
            id: categoryId,
            name: data.name,
            order: maxOrder + 1,
        };
        await categoryRef.set(newCategory);
    }
    
    revalidatePath('/services');
    revalidatePath('/');
    revalidatePath('/plan');

    const savedDoc = await firestore.collection('categories').where('name', '==', data.name).get();
    if (savedDoc.empty) {
        return { ...newCategory, id: categoryId } as Category;
    }
    return { ...savedDoc.docs[0].data(), id: savedDoc.docs[0].id } as Category;
}

/**
 * Updates the order of categories.
 */
export async function updateCategoryOrder(orderedCategories: Category[]) {
    if (!Array.isArray(orderedCategories)) {
        throw new Error('Invalid input for updating category order.');
    }
    
    const { firestore } = await initializeFirebaseAdmin();
    const batch = firestore.batch();

    orderedCategories.forEach((category, index) => {
        const categoryRef = firestore.doc(`categories/${category.id}`);
        batch.update(categoryRef, { order: index });
    });

    await batch.commit();

    revalidatePath('/services');
    revalidatePath('/');
    revalidatePath('/plan');
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
    
    const { firestore } = await initializeFirebaseAdmin();
    const batch = firestore.batch();

    const categoryRef = firestore.doc(`categories/${categoryId}`);
    batch.delete(categoryRef);

    const servicesQuery = firestore.collection('services').where('categoryId', '==', categoryId);
    const servicesSnapshot = await servicesQuery.get();
    
    const serviceIdsToDelete = servicesSnapshot.docs.map(d => d.id);
    servicesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });

    if (serviceIdsToDelete.length > 0) {
        const CHUNK_SIZE = 30;
        for (let i = 0; i < serviceIdsToDelete.length; i += CHUNK_SIZE) {
            const chunk = serviceIdsToDelete.slice(i, i + CHUNK_SIZE);
            const vsQuery = firestore.collection('vehicleServices').where('serviceId', 'in', chunk);
            const vsSnapshot = await vsQuery.get();
            vsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
    }

    await batch.commit();

    revalidatePath('/');
    revalidatePath('/services');
    revalidatePath('/plan');
}

    