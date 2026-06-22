import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-brand-50 to-cream-50 flex items-center justify-center"><div className="text-brand-700">Carregando...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
