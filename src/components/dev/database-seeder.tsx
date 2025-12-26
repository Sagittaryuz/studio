
'use client';

import { useState } from 'react';
import { doc, writeBatch } from 'firebase/firestore';
import { firestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { CATEGORIES, VEHICLES, SERVICES, VEHICLE_SERVICES_RAW } from '@/lib/mock-data';

export function DatabaseSeeder() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setIsLoading(true);
    toast({
      title: 'Iniciando a semeadura...',
      description: 'Enviando dados para o Firestore. Isso pode levar um momento.',
    });

    try {
      const batch = writeBatch(firestore);

      // Seed Categories
      CATEGORIES.forEach((category) => {
        const docRef = doc(firestore, 'categories', category.id);
        batch.set(docRef, category);
      });

      // Seed Services
      SERVICES.forEach((service) => {
        const docRef = doc(firestore, 'services', service.id);
        batch.set(docRef, service);
      });

      // Seed Vehicles
      VEHICLES.forEach((vehicle) => {
        const docRef = doc(firestore, 'vehicles', vehicle.id);
        batch.set(docRef, vehicle);
      });
      
      // Seed VehicleServices
      VEHICLE_SERVICES_RAW.forEach((vs) => {
        const docRef = doc(firestore, 'vehicleServices', vs.id);
        // Firestore works best with its own Timestamp object or ISO strings.
        // We'll convert our mock dates to ISO strings for seeding.
        const dataToSave = {
            ...vs,
            lastDate: new Date(vs.lastDate).toISOString(),
        }
        batch.set(docRef, dataToSave);
      });

      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: 'Seu banco de dados Firestore foi populado com os dados iniciais.',
        variant: 'default',
        duration: 5000,
      });
    } catch (error) {
      console.error('Erro ao semear o banco de dados:', error);
      toast({
        title: 'Erro de Semeadura',
        description: `Não foi possível enviar os dados. Verifique o console para mais detalhes.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // This button should only be visible in development environments
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Button onClick={handleSeed} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UploadCloud className="mr-2 h-4 w-4" />
      )}
      Seed Database
    </Button>
  );
}
