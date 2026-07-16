export default function ComoComprarPage() {
  const steps = [
    {
      number: "01",
      title: "Escolha seu produto",
      description: "Navegue pelo catálogo, filtre por categoria ou use a busca. Clique no produto para ver detalhes, fotos e variações disponíveis.",
    },
    {
      number: "02",
      title: "Selecione cor e tamanho",
      description: "Escolha a cor e o tamanho desejados. O estoque disponível por cor é exibido em tempo real.",
    },
    {
      number: "03",
      title: "Adicione ao carrinho",
      description: "Clique em \"Adicionar ao carrinho\". Você pode continuar comprando ou ir direto para o checkout.",
    },
    {
      number: "04",
      title: "Faça login ou cadastre-se",
      description: "Para finalizar, você precisa de uma conta. O cadastro é rápido e gratuito — basta nome, e-mail e senha.",
    },
    {
      number: "05",
      title: "Informe o endereço",
      description: "Digite seu CEP e o endereço de entrega será preenchido automaticamente. Confira e ajuste se necessário.",
    },
    {
      number: "06",
      title: "Escolha o pagamento",
      description: "Aceitamos cartão de crédito (em até 6x sem juros), PIX (5% de desconto) e boleto bancário.",
    },
    {
      number: "07",
      title: "Pedido confirmado!",
      description: "Você receberá um e-mail de confirmação. Acompanhe o status do pedido na área \"Minha Conta\".",
    },
  ];

  return (
    <div className="container-main py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Como Comprar
      </h1>
      <p className="text-gray-500 mb-10">É simples, rápido e seguro. Veja o passo a passo:</p>

      <div className="space-y-6">
        {steps.map((step) => (
          <div key={step.number} className="flex gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {step.number}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 p-5 bg-brand-50 rounded-2xl border border-brand-100">
        <p className="text-sm text-brand-800 font-medium">Ficou com dúvida?</p>
        <p className="text-sm text-brand-700 mt-1">Fale conosco pelo WhatsApp — respondemos rapidinho!</p>
      </div>
    </div>
  );
}
