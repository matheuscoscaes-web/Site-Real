import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Product, ProductImage } from "@/types";

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

/** O que o ProductCard precisa. Paginas com lista de produtos passam isso em vez
 * do produto inteiro: a descricao e todas as fotos iam junto no HTML de cada
 * card e deixavam a pagina de produtos com ~500KB. */
export type CardProduct = Pick<
  Product,
  "id" | "name" | "slug" | "price" | "categories" | "images" | "featured" | "permiteCupom"
> & {
  variants: { color: string | null; size: string | null; stock: number }[];
  /** Cor da variante a destacar (filtro de cor): o card abre o produto ja nela */
  preferredColor?: string | null;
};

/**
 * `matchesColor` vem do filtro de cor da vitrine: quando informado, o card
 * mostra a foto da variante daquela cor (e nao a foto principal, que pode ser
 * de outra cor) e o link abre o produto ja com ela selecionada.
 */
export function toCardProduct(p: Product, matchesColor?: (color: string) => boolean): CardProduct {
  const allImages = parseProductImages(p.images);
  let images = allImages;
  let preferredColor: string | null = null;
  if (matchesColor) {
    const variants = (p.variants ?? []).filter((v) => v.color && matchesColor(v.color));
    preferredColor = (variants.find((v) => v.stock > 0) ?? variants[0])?.color ?? null;
    if (preferredColor) {
      const own = allImages.filter((i) => i.color === preferredColor);
      if (own.length > 0) images = [...own, ...allImages.filter((i) => i.color !== preferredColor)];
    }
  }
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    categories: p.categories,
    // so as 2 primeiras fotos (principal + a do hover)
    images: JSON.stringify(images.slice(0, 2).map((i) => i.url)),
    featured: p.featured,
    permiteCupom: p.permiteCupom,
    variants: (p.variants ?? []).map((v) => ({ color: v.color, size: v.size, stock: v.stock })),
    preferredColor,
  };
}

/** Empurra produtos sem estoque (soma de variantes = 0) para o final da lista,
 * mantendo a ordem relativa dentro de cada grupo (disponíveis / esgotados). */
export function sortOutOfStockLast<T extends { variants?: { stock: number }[] }>(products: T[]): T[] {
  const isOutOfStock = (p: T) => (p.variants ?? []).reduce((sum, v) => sum + v.stock, 0) === 0;
  return [...products].sort((a, b) => Number(isOutOfStock(a)) - Number(isOutOfStock(b)));
}

/** Parcelamento sem juros: até 6x normalmente, até 10x em compras acima de R$600. */
export function getMaxInstallments(value: number): number {
  return value >= 600 ? 10 : 6;
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
  MERCADOPAGO: "Mercado Pago (site)",
  DINHEIRO: "Dinheiro",
  PIX_MANUAL: "PIX (manual)",
  CARTAO_MAQUININHA: "Cartão (maquininha)",
  TRANSFERENCIA: "Transferência",
  OUTRO: "Outro",
};

/** Formas de pagamento disponíveis pra registrar uma venda manual (balcão, WhatsApp etc). */
export const MANUAL_PAYMENT_METHODS = ["DINHEIRO", "PIX_MANUAL", "CARTAO_MAQUININHA", "TRANSFERENCIA", "OUTRO"];

/** Pedidos do checkout do site sempre usam MERCADOPAGO; qualquer outro método
 *  identifica uma venda registrada manualmente pelo admin (não existe coluna própria pra isso). */
export function isManualSale(paymentMethod: string): boolean {
  return paymentMethod !== "MERCADOPAGO";
}

/** Domínio fake usado como e-mail de clientes de venda manual sem e-mail informado
 * (ver app/api/admin/pedidos/manual/route.ts) — não existe de verdade, nunca enviar e-mail pra ele. */
export const PLACEHOLDER_EMAIL_DOMAIN = "@heartscouro.local";

export function hasRealEmail(email: string): boolean {
  return !email.endsWith(PLACEHOLDER_EMAIL_DOMAIN);
}

/** Categoria que nunca recebe desconto de cupom, independente do produto. */
export const COUPON_EXCLUDED_CATEGORY = "Acessórios";

/** Um produto só participa de desconto de cupom se permitir e não estiver na categoria excluída. */
export function isCupomElegivel(categories: string[], permiteCupom?: boolean | null): boolean {
  return permiteCupom !== false && !categories.includes(COUPON_EXCLUDED_CATEGORY);
}

const LETTER_SIZE_ORDER = ["PP", "P", "M", "G", "GG", "XG", "XXG", "U"];

/** Ordena tamanhos do jeito que a cliente espera: numeração em ordem numérica
 * (33, 34, 35...), letras na ordem de roupa (PP, P, M, G, GG) e o resto em ordem alfabética. */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    if (!Number.isNaN(n)) return [0, n] as const;
    const i = LETTER_SIZE_ORDER.indexOf(s.toUpperCase());
    return i >= 0 ? ([1, i] as const) : ([2, 0] as const);
  };
  return [...sizes].sort((a, b) => {
    const [ga, va] = rank(a);
    const [gb, vb] = rank(b);
    return ga - gb || va - vb || a.localeCompare(b, "pt-BR");
  });
}
export const COLORS = [
  "Preto", "Branco", "Off-White", "Bege", "Caramel", "Marrom",
  "Rosé", "Rose", "Rosa Floral", "Ouro Rosé", "Dourado", "Prata",
  "Azul", "Verde", "Tartaruga", "Coral",
];
