// IMPORTANT: This file should not be marked with "use client"
// It is intended for server-side use only.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseAdminServices {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
}

// Store a cached instance of the services
let adminServices: FirebaseAdminServices | null = null;

/**
 * Initializes and returns Firebase services for server-side use.
 * It uses a cached instance to avoid re-initializing on every call.
 */
export function initializeFirebaseAdmin(): FirebaseAdminServices {
  if (adminServices) {
    return adminServices;
  }

  if (getApps().length === 0) {
    initializeApp(firebaseConfig);
  }
  
  const firebaseApp = getApp();
  const firestore = getFirestore(firebaseApp);

  adminServices = { firebaseApp, firestore };
  
  return adminServices;
}
