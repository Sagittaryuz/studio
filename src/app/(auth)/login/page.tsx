'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { initiateEmailSignIn, useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { JCIcon } from '@/components/icons';


const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z
    .string()
    .min(6, { message: 'A senha deve ter no mínimo 6 caracteres.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    if (!auth) return;
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'Login bem-sucedido!',
        description: 'Bem-vindo de volta.',
      });
      // O AuthHandler cuidará do redirecionamento
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/invalid-credential'
          ? 'Email ou senha inválidos.'
          : 'Ocorreu um erro ao fazer login. Tente novamente.';
      toast({
        variant: 'destructive',
        title: 'Erro de Login',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <JCIcon className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
                Acesse sua conta para gerenciar a frota.
            </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...register('email')}
                autoComplete="email"
                />
                {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                >
                    Esqueceu a senha?
                </Link>
                </div>
                <div className="relative">
                <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="******"
                    {...register('password')}
                    autoComplete="current-password"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                </div>
                {errors.password && (
                <p className="text-sm text-destructive">
                    {errors.password.message}
                </p>
                )}
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                </Button>
                <Button variant="outline" asChild className="w-full">
                    <Link href="/signup">Criar uma conta</Link>
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
