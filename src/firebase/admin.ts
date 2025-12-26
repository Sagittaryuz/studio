
'use server';

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// Interface for the services do Firebase Admin to guarantee the typing
interface FirebaseAdminServices {
  app: admin.app.App;
  firestore: admin.firestore.Firestore;
}

// Stores the instance in cache to avoid reinitialization.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes in a safe way and returns the Firebase Admin services for use on the server.
 * Uses a singleton pattern to ensure that initialization occurs only once.
 */
export async function initializeFirebaseAdmin(): Promise<FirebaseAdminServices> {
  // If the instance already exists in the cache, returns it immediately.
  if (adminServices) {
    return adminServices;
  }

  // If no 'admin' application has been initialized yet, it does the initialization.
  if (!getApps().some(app => app.name === 'admin')) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: firebaseConfig.storageBucket, // Ensures that the storageBucket is provided.
    }, 'admin');
  }

  const adminApp = admin.app('admin');
  const firestore = admin.firestore(adminApp);
  
  // Stores the initialized instance in the cache.
  adminServices = {
    app: adminApp,
    firestore,
  };

  return adminServices;
}

    