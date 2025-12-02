'use client';

import { useEffect } from 'react';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';
import { useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export function AuthHandler({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
    const db = useFirestore();
  
    useEffect(() => {
        if (!auth || !db) return;

        const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
            if (user) {
                // User is signed in. Create their user document in Firestore.
                const userRef = doc(db, 'users', user.uid);
                // Use setDoc with merge: true to create the document if it doesn't exist,
                // or update it without overwriting if it does.
                try {
                    await setDoc(userRef, {
                        id: user.uid,
                        email: user.email || 'anonymous',
                        name: user.displayName || 'Anonymous User',
                        role: 'admin' // Assign a default role
                    }, { merge: true });
                } catch (error) {
                    console.error("Error creating user document:", error);
                }
            } else {
                // User is signed out. Initiate anonymous sign-in.
                initiateAnonymousSignIn(auth);
            }
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [auth, db]);

    return <>{children}</>;
}
