
'use server';

import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { firebaseConfig } from './config';

// Interface para os serviços do Firebase Admin para garantir a tipagem
interface FirebaseAdminServices {
  app: admin.app.App;
  firestore: admin.firestore.Firestore;
}

// Armazena a instância em cache para evitar reinicialização.
let adminServices: FirebaseAdminServices | null = null;

/**
 * Inicializa de forma segura e retorna os serviços do Firebase Admin para uso no servidor.
 * Usa um padrão singleton para garantir que a inicialização ocorra apenas uma vez.
 */
export async function initializeFirebaseAdmin(): Promise<FirebaseAdminServices> {
  // Se a instância já existe no cache, retorna-a imediatamente.
  if (adminServices) {
    return adminServices;
  }

  // Se nenhuma aplicação 'admin' foi inicializada ainda, faz a inicialização.
  if (!getApps().some(app => app.name === 'admin')) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: firebaseConfig.storageBucket, // Garante que o storageBucket seja fornecido.
    }, 'admin');
  }

  const adminApp = admin.app('admin');
  const firestore = admin.firestore(adminApp);
  
  // Armazena a instância inicializada no cache.
  adminServices = {
    app: adminApp,
    firestore,
  };

  return adminServices;
}

    