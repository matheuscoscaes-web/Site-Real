/**
 * Campanha Black November.
 *
 * O tema preto + dourado liga sozinho ate o fim da campanha e desliga depois.
 * Pra forcar, use a variavel de ambiente BLACK_MODE:
 *   BLACK_MODE=on   -> sempre ligado
 *   BLACK_MODE=off  -> sempre desligado
 *   (vazia)         -> automatico pelas datas abaixo
 */

// Horarios em Brasilia (UTC-3)
export const BLACK_FRIDAY = new Date("2026-11-27T00:00:00-03:00");
export const BLACK_END = new Date("2026-12-01T00:00:00-03:00");

export function isBlackModeActive(now = Date.now()): boolean {
  const flag = process.env.BLACK_MODE?.trim().toLowerCase();
  if (flag === "on") return true;
  if (flag === "off") return false;
  return now < BLACK_END.getTime();
}

/** Desconto em % do preco antigo pro preco atual (null se nao houver desconto). */
export function discountPercent(oldPrice: number | null | undefined, price: number): number | null {
  if (!oldPrice || oldPrice <= price) return null;
  const pct = Math.round((1 - price / oldPrice) * 100);
  return pct > 0 ? pct : null;
}

/* ------------------------------------------------------------------
 * Oferta: SITE INTEIRO COM 50% OFF, a partir de FLASH_SALE_START.
 * - todos os precos pela metade (o preco cheio aparece riscado)
 * - cupons pausados
 * - frete normal (frete gratis de produto e de cupom nao valem)
 * FLASH_SALE_END = null -> por tempo indeterminado (sem contagem regressiva).
 * Pra encerrar: ponha uma data em FLASH_SALE_END ou FLASH_SALE=off nas
 * variaveis de ambiente (FLASH_SALE=on forca ligada).
 * ------------------------------------------------------------------ */
export const FLASH_SALE_START = new Date("2026-11-12T00:00:00-03:00");
export const FLASH_SALE_END: Date | null = null;
export const FLASH_SALE_PERCENT = 50;
export const FLASH_SALE_COUPON_ERROR = "Os cupons estão pausados: o site inteiro já está com 50% off 🖤";

export function isFlashSaleActive(now = Date.now()): boolean {
  const flag = process.env.FLASH_SALE?.trim().toLowerCase();
  if (flag === "off") return false;
  if (flag === "on") return true;
  return now >= FLASH_SALE_START.getTime() && (FLASH_SALE_END === null || now < FLASH_SALE_END.getTime());
}

/** Preco com o desconto da oferta relampago (arredondado no centavo). */
export function flashSalePrice(price: number): number {
  return Math.round(price * (100 - FLASH_SALE_PERCENT)) / 100;
}

/**
 * Preco que o site cobra AGORA por um produto. Usar no servidor sempre que for
 * mostrar ou cobrar um preco.
 */
export function currentPrice(price: number, now = Date.now()): number {
  return isFlashSaleActive(now) ? flashSalePrice(price) : price;
}

/**
 * Aplica a oferta relampago num produto antes de mandar pra vitrine: preco pela
 * metade, preco cheio como "de" (vira o selo BLACK -50%) e sem frete gratis.
 */
export function withFlashSale<T extends { price: number; precoAntigo?: number | null; freteGratis?: boolean }>(p: T): T {
  if (!isFlashSaleActive()) return p;
  return { ...p, price: flashSalePrice(p.price), precoAntigo: p.price, freteGratis: false };
}
