// O que a pessoa já escolheu no carrinho (CEP, entrega, frete) fica salvo no
// navegador pro checkout abrir preenchido — sem isso ela digitava o CEP duas vezes.
// O CEP continua lá na próxima visita também.
const KEY = "hearts-checkout";

export interface CheckoutPrefill {
  cep?: string;
  deliveryType?: "ENTREGA" | "RETIRADA";
  freteId?: number;
}

export function loadPrefill(): CheckoutPrefill {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

export function savePrefill(patch: CheckoutPrefill) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...loadPrefill(), ...patch }));
  } catch { /* navegador sem storage: só não lembra */ }
}

export const formatCep = (raw: string) => {
  const v = raw.replace(/\D/g, "").slice(0, 8);
  return v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
};

// Só aceita caminhos internos no ?redirect= (evita mandar a pessoa pra outro site)
export const safeRedirect = (raw: string | null) =>
  raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
