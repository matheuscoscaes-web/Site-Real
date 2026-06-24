export default function PoliticasTrocasPage() {
  return (
    <div className="container-main py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Política de Trocas e Devoluções
      </h1>
      <p className="text-gray-500 mb-8">Última atualização: junho de 2025</p>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Prazo para troca ou devolução</h2>
          <p className="text-gray-600 leading-relaxed">
            Você tem até <strong>30 dias corridos</strong> a partir da data de recebimento do produto para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Condições para troca</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>O produto deve estar sem uso, com etiquetas originais</li>
            <li>Na embalagem original ou em embalagem que proteja adequadamente o item</li>
            <li>Acompanhado da nota fiscal</li>
            <li>Sem sinais de uso, manchas ou danos causados pelo cliente</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Como solicitar</h2>
          <p className="text-gray-600 leading-relaxed">
            Entre em contato conosco pelo WhatsApp ou e-mail informando o número do pedido e o motivo da troca. Nossa equipe responderá em até 2 dias úteis com as instruções de envio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Frete da troca</h2>
          <p className="text-gray-600 leading-relaxed">
            Em caso de defeito de fabricação, o frete de devolução é por nossa conta. Para trocas por preferência (tamanho, cor), o frete de envio ao nosso estoque é de responsabilidade do cliente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Reembolso</h2>
          <p className="text-gray-600 leading-relaxed">
            Após recebermos e avaliarmos o produto, o reembolso será processado em até <strong>10 dias úteis</strong> via o mesmo método de pagamento utilizado na compra.
          </p>
        </section>
      </div>

      <div className="mt-10 p-5 bg-brand-50 rounded-2xl border border-brand-100">
        <p className="text-sm text-brand-800 font-medium">Dúvidas? Fale conosco</p>
        <p className="text-sm text-brand-700 mt-1">WhatsApp ou e-mail — respondemos em até 1 dia útil.</p>
      </div>
    </div>
  );
}
