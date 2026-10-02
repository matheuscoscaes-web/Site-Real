import { WELCOME_COUPON_CODE } from "@/lib/coupons";

const WELCOME_COUPON_FLAT_DEDUCTION = 15;

// Pedidos com o cupom de boas-vindas contam receita com dedução fixa de R$15
// em vez do total real, a pedido do usuário (2026-07-31).
export const orderRevenue = (o: { total: number; couponCode: string | null }) =>
  o.couponCode === WELCOME_COUPON_CODE ? Math.max(0, o.total - WELCOME_COUPON_FLAT_DEDUCTION) : o.total;

// ---------------------------------------------------------------------------
// Datas sempre no fuso de São Paulo: o servidor roda em UTC e um pedido feito
// às 23h do dia 15 não pode cair na quinzena (ou mês) seguinte.
// ---------------------------------------------------------------------------
function spDate(d: Date) {
  const [y, m, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .split("-")
    .map(Number);
  return { y, m, day };
}
// Chaves numéricas sequenciais: mês = y*12+(m-1); quinzena = y*24+(m-1)*2+(0|1)
export const monthKeyOf = (d: Date) => { const { y, m } = spDate(d); return y * 12 + (m - 1); };
export const fortnightKeyOf = (d: Date) => { const { y, m, day } = spDate(d); return y * 24 + (m - 1) * 2 + (day > 15 ? 1 : 0); };

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
// "Setembro de 2026" (long) ou "set/26" (short)
const monthName = (y: number, m: number, style: "long" | "short" = "long") =>
  style === "long"
    ? `${MONTHS[m - 1].charAt(0).toUpperCase()}${MONTHS[m - 1].slice(1)} de ${y}`
    : `${MONTHS[m - 1].slice(0, 3)}/${String(y).slice(2)}`;
export const monthInfo = (key: number) => {
  const y = Math.floor(key / 12);
  const m = (key % 12) + 1;
  const mm = String(m).padStart(2, "0");
  return { y, m, label: monthName(y, m), short: monthName(y, m, "short"), range: `01/${mm} a ${new Date(y, m, 0).getDate()}/${mm}`, param: `m-${y}-${mm}` };
};
export const fortnightInfo = (key: number) => {
  const y = Math.floor(key / 24);
  const m = Math.floor((key % 24) / 2) + 1;
  const half = key % 2;
  const mm = String(m).padStart(2, "0");
  const n = half === 0 ? "1ª" : "2ª";
  return {
    y, m, half,
    label: `${n} quinzena de ${monthName(y, m).toLowerCase()}`,
    short: `${n} ${monthName(y, m, "short")}`,
    range: half === 0 ? `01/${mm} a 15/${mm}` : `16/${mm} a ${new Date(y, m, 0).getDate()}/${mm}`,
    param: `q-${y}-${mm}-${half + 1}`,
  };
};
