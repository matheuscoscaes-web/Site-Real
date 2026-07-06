import { Suspense } from "react";
import { RedefinirSenhaForm } from "./RedefinirSenhaForm";

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-brand-50 to-cream-50 flex items-center justify-center"><div className="text-brand-700">Carregando...</div></div>}>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
