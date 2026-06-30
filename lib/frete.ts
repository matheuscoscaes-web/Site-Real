export interface FreteOption {
  id: number;
  name: string;
  company: string;
  price: number;
  days: number;
}

const ME_URL = "https://melhorenvio.com.br/api/v2/me";

export async function calcularFrete(cep: string, totalItems: number = 1): Promise<FreteOption[]> {
  const cepNumerico = cep.replace(/\D/g, "");
  if (cepNumerico.length !== 8) throw new Error("CEP inválido");

  const token = process.env.MELHOR_ENVIO_TOKEN;
  const cepOrigem = process.env.MELHOR_ENVIO_CEP_ORIGEM?.replace(/\D/g, "");

  if (!token || !cepOrigem) throw new Error("Frete não configurado");

  const qtd = Math.max(1, totalItems);

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
      to: { postal_code: cepNumerico },
      package: {
        height: 11 * qtd,
        width: 30,
        length: 32,
        weight: qtd,
      },
    }),
  });

  if (!res.ok) throw new Error("Erro ao consultar frete");

  const data = await res.json();

  const ALLOWED = ["PAC", "SEDEX"];

  return (data as Record<string, unknown>[])
    .filter((s) => !s.error && ALLOWED.includes(s.name as string))
    .map((s) => ({
      id: s.id as number,
      name: s.name as string,
      company: (s.company as { name: string }).name,
      price: parseFloat(s.price as string) + 7,
      days: s.delivery_time as number,
    }))
    .sort((a, b) => a.price - b.price);
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
