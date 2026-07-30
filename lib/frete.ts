export interface FreteOption {
  id: number;
  name: string;
  company: string;
  price: number;
  days: number;
  /** Nome pra mostrar pro cliente. Igual a `name` normalmente; quando PAC/SEDEX não atendem o CEP
   *  e caímos numa transportadora alternativa, vira "Correios" pra não expor a transportadora real
   *  (o admin continua vendo o nome/empresa reais em `name`/`company`). */
  customerLabel: string;
  fallback: boolean;
}

const ME_URL = "https://melhorenvio.com.br/api/v2/me";
const HANDLING_FEE = 7;

// Cada item empilhado soma 11cm de altura na caixa. Correios/transportadoras recusam
// (ou cotam errado) uma caixa com lado maior que ~105cm, então pedidos grandes viram
// múltiplas caixas físicas em vez de uma caixa impossível de 200+cm de altura.
const BOX_HEIGHT_PER_ITEM = 11;
const BOX_WIDTH = 30;
const BOX_LENGTH = 32;
const MAX_ITEMS_PER_BOX = 9; // 9 * 11cm = 99cm, dentro do limite de ~105cm por lado

interface RawQuote {
  id: number;
  name: string;
  company: { name: string };
  price: string;
  delivery_time: number;
  error?: unknown;
}

async function cotarCaixa(cepOrigem: string, cepDestino: string, token: string, itensNaCaixa: number): Promise<RawQuote[]> {
  const res = await fetch(`${ME_URL}/shipment/calculate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "HeartsCouro/1.0 (ffernandoccaio2004@gmail.com)",
    },
    body: JSON.stringify({
      from: { postal_code: cepOrigem },
      to: { postal_code: cepDestino },
      package: {
        height: BOX_HEIGHT_PER_ITEM * itensNaCaixa,
        width: BOX_WIDTH,
        length: BOX_LENGTH,
        weight: itensNaCaixa,
      },
    }),
  });

  if (!res.ok) throw new Error("Erro ao consultar frete");

  const data = await res.json();
  return (data as RawQuote[]).filter((s) => !s.error && s.price != null);
}

export async function calcularFrete(cep: string, totalItems: number = 1): Promise<FreteOption[]> {
  const cepNumerico = cep.replace(/\D/g, "");
  if (cepNumerico.length !== 8) throw new Error("CEP inválido");

  const token = process.env.MELHOR_ENVIO_TOKEN;
  const cepOrigem = process.env.MELHOR_ENVIO_CEP_ORIGEM?.replace(/\D/g, "");

  if (!token || !cepOrigem) throw new Error("Frete não configurado");

  const qtd = Math.max(1, totalItems);

  const caixasFechadas = Math.floor(qtd / MAX_ITEMS_PER_BOX);
  const resto = qtd % MAX_ITEMS_PER_BOX;
  const caixas = [
    ...(caixasFechadas > 0 ? [{ itensNaCaixa: MAX_ITEMS_PER_BOX, quantidade: caixasFechadas }] : []),
    ...(resto > 0 ? [{ itensNaCaixa: resto, quantidade: 1 }] : []),
  ];

  const cotacoesPorCaixa = await Promise.all(
    caixas.map(async (caixa) => ({
      quotes: await cotarCaixa(cepOrigem, cepNumerico, token, caixa.itensNaCaixa),
      quantidade: caixa.quantidade,
    }))
  );

  // Soma o preço de cada caixa por serviço (nome da transportadora) e usa o maior
  // prazo entre elas — só mantém serviços cotados com sucesso em TODAS as caixas,
  // já que não dá pra despachar parte do pedido por uma transportadora e o resto por outra.
  const combinados = new Map<string, { id: number; name: string; company: string; price: number; days: number; ocorrencias: number }>();
  for (const { quotes, quantidade } of cotacoesPorCaixa) {
    for (const s of quotes) {
      const price = parseFloat(s.price) * quantidade;
      const existente = combinados.get(s.name);
      if (existente) {
        existente.price += price;
        existente.days = Math.max(existente.days, s.delivery_time);
        existente.ocorrencias++;
      } else {
        combinados.set(s.name, { id: s.id, name: s.name, company: s.company.name, price, days: s.delivery_time, ocorrencias: 1 });
      }
    }
  }

  const disponiveis = [...combinados.values()].filter((s) => s.ocorrencias === cotacoesPorCaixa.length);

  const ALLOWED = ["PAC", "SEDEX"];

  let escolhidas = disponiveis.filter((s) => ALLOWED.includes(s.name));
  let isFallback = false;

  // PAC/SEDEX não atendem esse CEP (comum em áreas mais remotas): usa a transportadora
  // mais barata disponível como alternativa, em vez de travar o checkout do cliente.
  if (escolhidas.length === 0 && disponiveis.length > 0) {
    isFallback = true;
    const maisBarata = disponiveis.slice().sort((a, b) => a.price - b.price)[0];
    escolhidas = [maisBarata];
  }

  return escolhidas
    .map((s) => ({
      id: s.id,
      name: s.name,
      company: s.company,
      price: s.price + HANDLING_FEE,
      days: s.days,
      customerLabel: isFallback ? "Correios" : s.name,
      fallback: isFallback,
    }))
    .sort((a, b) => a.price - b.price);
}

/** Busca o código de rastreio de um envio já postado no Melhor Envio.
 * Retorna null se ainda não estiver disponível (a transportadora só gera
 * o código depois da coleta em alguns casos) — nunca lança erro, é best-effort. */
export async function buscarCodigoRastreio(meOrderId: string): Promise<string | null> {
  const token = process.env.MELHOR_ENVIO_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`${ME_URL}/shipment/tracking`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "HeartsCouro/1.0 (ffernandoccaio2004@gmail.com)",
      },
      body: JSON.stringify({ orders: [meOrderId] }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const entry = (data as Record<string, { tracking?: string | null }>)[meOrderId];
    return entry?.tracking || null;
  } catch {
    return null;
  }
}

export async function buscarEnderecoPorCEP(cep: string) {
  const cepNumerico = cep.replace(/\D/g, "");
  if (cepNumerico.length !== 8) throw new Error("CEP inválido");

  const res = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
  const data = await res.json();

  if (data.erro) throw new Error("CEP não encontrado");

  return {
    street: data.logradouro,
    district: data.bairro,
    city: data.localidade,
    state: data.uf,
    zipCode: cep,
  };
}
