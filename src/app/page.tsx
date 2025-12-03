import { redirect } from 'next/navigation';

export default function Home() {
  // A lógica de redirecionamento baseada na função do usuário será tratada no componente <AuthHandler>
  // ou em um middleware. Por enquanto, redirecionamos para o login.
  redirect('/login');
}
