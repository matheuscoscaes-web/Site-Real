/** Tamanho/peso da caixa e seguro usados na cotação e na etiqueta do Melhor Envio. */
export type Caixa = {
  height: number; // cm
  width: number; // cm
  length: number; // cm
  weight: number; // kg
  insuranceValue: number; // R$ declarado (0 = sem seguro)
};

/** Padrão antigo do site: 11 cm de altura e 1 kg por peça, numa caixa 30×32. */
export function caixaPadrao(totalItems: number): Caixa {
  const n = Math.max(1, totalItems);
  return { height: 11 * n, width: 30, length: 32, weight: n, insuranceValue: 0 };
}

function num(v: unknown, min: number, max: number): number | null {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

/** Lê a caixa enviada pela tela; o que vier faltando/errado cai no padrão. */
export function parseCaixa(raw: unknown, totalItems: number): Caixa {
  const d = caixaPadrao(totalItems);
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    height: num(r.height, 1, 100) ?? d.height,
    width: num(r.width, 1, 100) ?? d.width,
    length: num(r.length, 1, 100) ?? d.length,
    weight: num(r.weight, 0.01, 30) ?? d.weight,
    insuranceValue: num(r.insuranceValue, 0, 100000) ?? 0,
  };
}
