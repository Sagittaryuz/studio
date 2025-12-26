
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

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
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { JCIcon } from '@/components/icons';

const formSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setEmailSent(true);
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para as instruções de redefinição de senha.',
      });
    } catch (error: any) {
      console.error(error);
      const errorMessage =
        error.code === 'auth/user-not-found'
          ? 'Nenhum usuário encontrado com este email.'
          : 'Ocorreu um erro. Tente novamente.';
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar email',
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
            <CardTitle className="text-2xl">Esqueceu sua Senha?</CardTitle>
            <CardDescription>
                {emailSent
                ? 'Se uma conta com este email existir, um link para redefinir a senha foi enviado.'
                : 'Insira seu email para receber um link de redefinição de senha.'}
            </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            {!emailSent && (
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
                </CardContent>
            )}
            <CardFooter className="flex flex-col gap-4">
            {!emailSent && (
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Link de Redefinição
                </Button>
            )}
            <Button variant="link" asChild className="w-full">
                <Link href="/login">Voltar para o Login</Link>
            </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
