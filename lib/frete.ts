// Simulação de cálculo de frete por CEP
// Para integração real: substituir pela API dos Correios ou Melhor Envio

export interface FreteOption {
  name: string;
  price: number;
  days: number;
  code: string;
}

export async function calcularFrete(cep: string, subtotal: number): Promise<FreteOption[]> {
  // Remove formatação do CEP
  const cepNumerico = cep.replace(/\D/g, "");

  if (cepNumerico.length !== 8) {
    throw new Error("CEP inválido");
  }

  // Frete grátis acima de R$ 299,90
  const freteGratis = subtotal >= 299.90;

  // Simula tempo de processamento da API
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Tabela de frete por região (baseado no primeiro dígito do CEP)
  const prefix = cepNumerico[0];

  const tabela: Record<string, { sedex: number; pac: number; sedexDays: number; pacDays: number }> = {
    "0": { sedex: 18.90, pac: 12.90, sedexDays: 2, pacDays: 5 },  // SP Capital
    "1": { sedex: 22.90, pac: 14.90, sedexDays: 2, pacDays: 6 },  // SP Interior
    "2": { sedex: 28.90, pac: 16.90, sedexDays: 3, pacDays: 7 },  // RJ/ES
    "3": { sedex: 28.90, pac: 16.90, sedexDays: 3, pacDays: 8 },  // MG
    "4": { sedex: 32.90, pac: 18.90, sedexDays: 3, pacDays: 8 },  // BA/SE
    "5": { sedex: 32.90, pac: 18.90, sedexDays: 4, pacDays: 9 },  // PE/AL/PB/RN
    "6": { sedex: 35.90, pac: 22.90, sedexDays: 4, pacDays: 10 }, // CE/MA/PI
    "7": { sedex: 42.90, pac: 28.90, sedexDays: 5, pacDays: 12 }, // Norte
    "8": { sedex: 26.90, pac: 15.90, sedexDays: 2, pacDays: 6 },  // PR/SC
    "9": { sedex: 29.90, pac: 17.90, sedexDays: 3, pacDays: 7 },  // RS/MS/MT
  };

  const regiao = tabela[prefix] || tabela["0"];

  return [
    {
      name: "SEDEX",
      price: freteGratis ? 0 : regiao.sedex,
      days: regiao.sedexDays,
      code: "SEDEX",
    },
    {
      name: "PAC",
      price: freteGratis ? 0 : regiao.pac,
      days: regiao.pacDays,
      code: "PAC",
    },
  ];
}

export async function buscarEnderecoPorCEP(cep: string) {
  const cepNumerico = cep.replace(/\D/g, "");
  if (cepNumerico.length !== 8) throw new Error("CEP inválido");

  // Integração real com ViaCEP (gratuito, sem chave de API)
  const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
  const data = await response.json();

  if (data.erro) throw new Error("CEP não encontrado");

  return {
    street: data.logradouro,
    district: data.bairro,
    city: data.localidade,
    state: data.uf,
    zipCode: cep,
  };
}
