export default function PrivacidadePage() {
  return (
    <div className="container-main py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
        Política de Privacidade
      </h1>
      <p className="text-gray-500 mb-8">Última atualização: junho de 2025</p>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Quais dados coletamos</h2>
          <p className="text-gray-600 leading-relaxed">
            Coletamos apenas os dados necessários para processar seus pedidos: nome, e-mail, telefone, endereço de entrega e informações de pagamento. Nenhum dado de cartão é armazenado em nossos servidores.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Como usamos seus dados</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Processar e entregar seus pedidos</li>
            <li>Enviar atualizações sobre o status do pedido</li>
            <li>Enviar promoções e novidades (apenas se você autorizar)</li>
            <li>Melhorar a experiência de compra na plataforma</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Compartilhamento de dados</h2>
          <p className="text-gray-600 leading-relaxed">
            Seus dados não são vendidos a terceiros. Compartilhamos informações de entrega apenas com as transportadoras necessárias para entregar seu pedido.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Seus direitos</h2>
          <p className="text-gray-600 leading-relaxed">
            Conforme a LGPD (Lei Geral de Proteção de Dados), você pode solicitar a qualquer momento: acesso aos seus dados, correção de informações incorretas ou exclusão da sua conta. Entre em contato conosco pelo e-mail ou WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Utilizamos cookies essenciais para manter sua sessão ativa e o carrinho de compras funcionando. Não utilizamos cookies de rastreamento de terceiros.
          </p>
        </section>
      </div>

      <div className="mt-10 p-5 bg-brand-50 rounded-2xl border border-brand-100">
        <p className="text-sm text-brand-800 font-medium">Dúvidas sobre seus dados?</p>
        <p className="text-sm text-brand-700 mt-1">Entre em contato — respondemos em até 1 dia útil.</p>
      </div>
    </div>
  );
}
