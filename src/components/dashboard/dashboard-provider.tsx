
'use client';

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useCollection, useUser } from '@/firebase';
import { processDashboardData, DashboardData } from '@/lib/data';
import type { Vehicle, Service, RawVehicleService, Category, CorrectiveServiceRecord, UserRole } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface DashboardContextValue {
  data: Omit<DashboardData, 'userRole' | 'appUsers'> | null;
  isLoading: boolean;
  error: any;
  userRole: UserRole;
  appUsers: any[];
}

const DashboardContext = createContext<DashboardContextValue | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();

  const categoriesQuery = useMemo(() => query(collection(firestore, 'categories'), orderBy('order')), [firestore]);

  const { data: vehicles, isLoading: loadingVehicles, error: errorVehicles } = useCollection<Vehicle>(useMemo(() => collection(firestore, 'vehicles'), [firestore]));
  const { data: services, isLoading: loadingServices, error: errorServices } = useCollection<Service>(useMemo(() => collection(firestore, 'services'), [firestore]));
  const { data: vehicleServices, isLoading: loadingVehicleServices, error: errorVehicleServices } = useCollection<RawVehicleService>(useMemo(() => collection(firestore, 'vehicleServices'), [firestore]));
  const { data: categories, isLoading: loadingCategories, error: errorCategories } = useCollection<Category>(categoriesQuery);
  const { data: correctiveServices, isLoading: loadingCorrective, error: errorCorrective } = useCollection<CorrectiveServiceRecord>(useMemo(() => collection(firestore, 'correctiveServiceRecords'), [firestore]));
  const { data: appUsers, isLoading: loadingUsers, error: errorUsers } = useCollection<any>(useMemo(() => collection(firestore, 'users'), [firestore]));

  const isLoading = loadingVehicles || loadingServices || loadingVehicleServices || loadingCategories || loadingCorrective || loadingUsers;
  const error = errorVehicles || errorServices || errorVehicleServices || errorCategories || errorCorrective || errorUsers;

  const processedData = useMemo(() => {
    if (!vehicles || !services || !vehicleServices || !categories || !correctiveServices) {
      return null;
    }
    return processDashboardData(vehicles, services, vehicleServices, categories, correctiveServices);
  }, [vehicles, services, vehicleServices, categories, correctiveServices]);

  const currentUser = useMemo(() => appUsers?.find(u => u.id === user?.uid), [appUsers, user]);
  const userRole: UserRole = currentUser?.role || 'DRIVER';

  const value = {
    data: processedData,
    isLoading,
    error,
    userRole,
    appUsers: appUsers || [],
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  const { data, isLoading, error, userRole, appUsers } = context;

  const dashboardData = useMemo(() => {
    if (!data) return null;
    return {
        ...data,
        userRole,
        appUsers,
    }
  }, [data, userRole, appUsers]);

  return { data: dashboardData, isLoading, error };
}
