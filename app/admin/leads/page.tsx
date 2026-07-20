import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function LeadsPage() {
  const leads = await prisma.whatsappLead.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grupo VIP WhatsApp</h1>
          <p className="text-sm text-gray-500 mt-1">{leads.length} contato{leads.length !== 1 ? "s" : ""} na lista</p>
        </div>
        {leads.length > 0 && (
          <a
            href="/api/admin/leads/vcard"
            className="inline-flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex-shrink-0"
          >
            📇 Baixar contatos (.vcf)
          </a>
        )}
      </div>

      {leads.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 text-sm text-blue-800">
          <p className="font-bold mb-2">Como adicionar todo mundo no grupo de uma vez</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Clique em <strong>&quot;Baixar contatos (.vcf)&quot;</strong> pelo Safari do celular que tem o WhatsApp da loja.</li>
            <li>
              <strong>iPhone:</strong> deve abrir direto a tela &quot;Adicionar todos os X contatos&quot; — toque em Adicionar.
              Se em vez disso aparecer um texto/página em branco, toque no ícone de compartilhar (□↑) no topo, escolha
              <strong> &quot;Salvar em Arquivos&quot;</strong>, depois abra pelo app <strong>Arquivos</strong> e toque no arquivo salvo.
              <br /><strong>Android:</strong> o arquivo baixa e já pergunta se quer importar os contatos — confirme.
            </li>
            <li>Abra o grupo no WhatsApp → <strong>Adicionar participante</strong> → agora todos aparecem na lista de contatos, prontos pra selecionar em massa (marca vários de uma vez, sem precisar digitar número por número).</li>
          </ol>
        </div>
      )}

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-4xl mb-3">💚</p>
          <p className="text-gray-500">Nenhum contato ainda. Divulgue o site!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">#</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">WhatsApp</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Data</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-600">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead, i) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-400">{leads.length - i}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-5 py-3 font-mono text-gray-700">
                      {lead.phone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "($2) $3-$4")}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(lead.createdAt.toISOString())}</td>
                    <td className="px-5 py-3">
                      <a
                        href={`https://wa.me/55${lead.phone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                      >
                        💬 Adicionar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
