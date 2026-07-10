import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProductImage } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** O campo `images` do produto guarda um JSON que pode misturar strings
 * (URL pura) e objetos `{ url, color }` — normaliza os dois formatos. */
export function parseProductImages(raw: string): ProductImage[] {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) =>
      typeof item === "string" ? { url: item } : { url: item.url || "", color: item.color || null }
    );
  } catch {
    return [];
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
}

export function formatCEP(cep: string): string {
  return cep.replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Aguardando Pagamento",
  PAID: "Pago",
  PREPARING: "Em Separação",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const PAYMENT_LABELS: Record<string, string> = {
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão de Crédito",
  BOLETO: "Boleto Bancário",
};

export const CATEGORIES = ["Bolsas", "Mochilas", "Bolsa Tira-Colo", "Acessórios"];

/** Categoria que nunca recebe desconto de cupom, independente do produto. */
export const COUPON_EXCLUDED_CATEGORY = "Acessórios";

/** Um produto só participa de desconto de cupom se permitir e não estiver na categoria excluída. */
export function isCupomElegivel(categories: string[], permiteCupom?: boolean | null): boolean {
  return permiteCupom !== false && !categories.includes(COUPON_EXCLUDED_CATEGORY);
}

/** Subcategorias exibidas como seções dentro de uma categoria pai (ex: menu, sidebar de filtros). */
export const SUBCATEGORIES: Record<string, string[]> = {
  "Acessórios": ["Carteira Feminina", "Carteira Masculina"],
};
export const SIZES = ["PP", "P", "M", "G", "GG", "36", "38", "40", "42", "44"];
export const COLORS = [
  "Preto", "Branco", "Off-White", "Bege", "Caramel", "Marrom",
  "Rosé", "Rose", "Rosa Floral", "Ouro Rosé", "Dourado", "Prata",
  "Azul", "Verde", "Tartaruga", "Coral",
];
