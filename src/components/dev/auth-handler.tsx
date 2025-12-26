
'use client';

import { useEffect, useState } from 'react';
import { useUser, firestore, auth } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { AppUser } from '@/lib/types';


const protectedRoutes = ['/dashboard', '/plan', '/services', '/reports', '/profile', '/checklist', '/authorizations', '/users'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

const roleRedirects: Record<string, string> = {
    ADMIN: '/dashboard',
    MASTER: '/dashboard',
    DRIVER: '/checklist',
};

export function AuthHandler({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const [appUser, setAppUser] = useState<AppUser | null>(null);
    const [isAppUserLoading, setAppUserLoading] = useState(true);

    useEffect(() => {
        if (isUserLoading) return;

        const handleUser = async () => {
            if (user && firestore) {
                // User is logged in, fetch their profile from Firestore
                const userRef = doc(firestore, 'users', user.uid);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data() as AppUser;
                    setAppUser(userData);

                    const targetPath = roleRedirects[userData.role] || '/login';
                    
                    if (authRoutes.includes(pathname)) {
                         router.replace(targetPath);
                    } else if (protectedRoutes.includes(pathname)) {
                        // User is in a protected route, check if they have access
                        if (userData.role === 'DRIVER' && !['/checklist', '/profile'].includes(pathname)) {
                           router.replace('/checklist');
                        }
                    }

                } else {
                    // This case is for first-time sign-ups or inconsistencies.
                    // We'll create a basic profile.
                    const newUser: AppUser = {
                        id: user.uid,
                        email: user.email || 'unknown',
                        name: user.displayName || 'New User',
                        role: user.email === 'cleriston.sousa@jcruzeiro.com' ? 'ADMIN' : 'DRIVER', // Default role
                        createdAt: new Date().toISOString(),
                    }
                    await setDoc(userRef, newUser);
                    setAppUser(newUser);
                    router.replace(roleRedirects[newUser.role] || '/login');
                }
            } else {
                // User is not logged in
                setAppUser(null);
                if (protectedRoutes.includes(pathname)) {
                    router.replace('/login');
                }
            }
            setAppUserLoading(false);
        };

        handleUser();

    }, [user, isUserLoading, router, pathname]);

    if (isUserLoading || isAppUserLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Pass the appUser to children if needed, or just render children
    return <>{children}</>;
}
