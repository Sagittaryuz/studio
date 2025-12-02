'use client';

import { useEffect } from 'react';
import { useAuth, initiateAnonymousSignIn } from '@/firebase';

export function AuthHandler({ children }: { children: React.ReactNode }) {
    const auth = useAuth();
  
    useEffect(() => {
        if (auth) {
            initiateAnonymousSignIn(auth);
        }
    }, [auth]);

    return <>{children}</>;
}
