
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, firestore, useUser } from '@/firebase';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/app-layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Camera } from 'lucide-react';
import { getSignedUploadUrl } from '@/app/actions';

const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, 'Senha atual é obrigatória.'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres.'),
  });

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [isProfileSubmitting, setProfileSubmitting] = useState(false);
  const [isPasswordSubmitting, setPasswordSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.displayName || '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ name: user.displayName || '' });
    }
  }, [user, profileForm]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    if (!user || !auth) return;

    setProfileSubmitting(true);
    try {
      let photoURL = user.photoURL;
      
      // Upload new photo if one is selected
      if (photo) {
        const filePath = `profile-pictures/${user.uid}`;
        const response = await getSignedUploadUrl(filePath, photo.type);

        if (!response.success || !response.uploadUrl || !response.publicUrl) {
            throw new Error(response.error || 'Failed to get signed URL');
        }

        await fetch(response.uploadUrl, {
            method: 'PUT',
            body: photo,
            headers: {
                'Content-Type': photo.type,
            },
        });
        
        photoURL = response.publicUrl;
      }

      // Update Firebase Auth profile
      await updateProfile(auth.currentUser!, {
        displayName: data.name,
        photoURL: photoURL,
      });

      // Update Firestore user document
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, { name: data.name, photoUrl: photoURL }, { merge: true });

      toast({ title: 'Perfil atualizado com sucesso!' });
      setPhoto(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Erro ao atualizar perfil', description: 'O upload da foto falhou.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    if (!user || !auth) return;
    setPasswordSubmitting(true);

    try {
      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, data.newPassword);
      
      toast({ title: 'Senha alterada com sucesso!' });
      passwordForm.reset();

    } catch (error: any) {
        console.error(error);
        const message = error.code === 'auth/wrong-password' 
            ? 'A senha atual está incorreta.' 
            : 'Ocorreu um erro ao alterar a senha.';
        toast({ variant: 'destructive', title: 'Erro', description: message });
    } finally {
        setPasswordSubmitting(false);
    }
  }

  if (isUserLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <main className="p-4 md:p-6 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="md:col-span-1">
                <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>Atualize seu nome e foto.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={photoPreview || user?.photoURL || undefined} alt="Foto de Perfil" />
                                    <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Label htmlFor="photo-upload" className="absolute -bottom-2 -right-2 cursor-pointer rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90">
                                    <Camera size={16} />
                                    <Input id="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handlePhotoChange} />
                                </Label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" {...profileForm.register('name')} />
                            {profileForm.formState.errors.name && (
                                <p className="text-sm text-destructive">{profileForm.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user?.email || ''} disabled />
                        </div>
                        <Button type="submit" disabled={isProfileSubmitting} className="w-full">
                            {isProfileSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle>Alterar Senha</CardTitle>
                    <CardDescription>Escolha uma nova senha forte.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Senha Atual</Label>
                            <div className="relative">
                                <Input id="current-password" type={showCurrentPassword ? 'text' : 'password'} {...passwordForm.register('currentPassword')} />
                                <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                            </div>
                             {passwordForm.formState.errors.currentPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nova Senha</Label>
                             <div className="relative">
                                <Input id="new-password" type={showNewPassword ? 'text' : 'password'} {...passwordForm.register('newPassword')} />
                                 <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNewPassword(!showNewPassword)}>
                                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </Button>
                            </div>
                            {passwordForm.formState.errors.newPassword && (
                                <p className="text-sm text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
                            )}
                        </div>
                        <Button type="submit" disabled={isPasswordSubmitting} className="w-full">
                             {isPasswordSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Alterar Senha
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
      </main>
    </AppLayout>
  );
}
