
'use server';

import admin from 'firebase-admin';
import { firebaseConfig } from './config';

interface FirebaseAdminServices {
  firestore: admin.firestore.Firestore;
}

let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes and returns Firebase Admin services for server-side use.
 * It uses a cached instance to avoid re-initializing on every call.
 */
export async function initializeFirebaseAdmin(): Promise<FirebaseAdminServices> {
  if (adminServices) {
    return adminServices;
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: firebaseConfig.storageBucket, // Ensure storage bucket is included
    });
  }

  const firestore = admin.firestore();
  adminServices = { firestore };

  return adminServices;
}
