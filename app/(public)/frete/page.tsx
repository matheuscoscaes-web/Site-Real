export default function FretePage() {
  return (
    <div className="container-main py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Frete e Prazo de Entrega
      </h1>
      <p className="text-gray-500 mb-8">Informações sobre envio dos seus pedidos</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frete grátis</h2>
          <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
            <p className="text-green-800 font-semibold">Frete grátis em compras acima de R$ 299,90</p>
            <p className="text-green-700 text-sm mt-1">Válido para todo o Brasil via PAC ou SEDEX (conforme disponibilidade).</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Primeira compra</h2>
          <div className="p-5 bg-brand-50 rounded-2xl border border-brand-100">
            <p className="text-brand-800 font-semibold">40% de desconto + frete grátis na primeira compra</p>
            <p className="text-brand-700 text-sm mt-1">O desconto é aplicado automaticamente no checkout para novos clientes.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Modalidades de envio</h2>
          <div className="space-y-3">
            {[
              { name: "PAC", prazo: "6 a 12 dias úteis", descricao: "Entrega econômica pelos Correios" },
              { name: "SEDEX", prazo: "2 a 5 dias úteis", descricao: "Entrega expressa pelos Correios" },
            ].map((m) => (
              <div key={m.name} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center font-bold text-brand-700 text-sm border border-gray-200 flex-shrink-0">
                  {m.name}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{m.prazo}</p>
                  <p className="text-sm text-gray-500">{m.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Prazo de postagem</h2>
          <p className="text-gray-600 leading-relaxed">
            Os pedidos são processados e postados em até <strong>2 dias úteis</strong> após a confirmação do pagamento. Pedidos realizados nos finais de semana ou feriados são processados no próximo dia útil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Rastreamento</h2>
          <p className="text-gray-600 leading-relaxed">
            Após a postagem, você receberá o código de rastreamento por e-mail. Acompanhe seu pedido diretamente no site dos Correios ou na área <strong>"Meus Pedidos"</strong> da sua conta.
          </p>
        </section>
      </div>

      <div className="mt-10 p-5 bg-brand-50 rounded-2xl border border-brand-100">
        <p className="text-sm text-brand-800 font-medium">Dúvidas sobre entrega?</p>
        <p className="text-sm text-brand-700 mt-1">Fale conosco pelo WhatsApp — respondemos em até 1 dia útil.</p>
      </div>
    </div>
  );
}
