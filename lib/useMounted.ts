"use client";

import { useEffect, useState } from "react";

// Carrinho e favoritos ficam no localStorage: no servidor estao sempre vazios e
// no navegador ja vem preenchidos. Quem mostra esses dados espera montar antes,
// senao o React acusa diferenca entre o HTML do servidor e o do navegador.
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
