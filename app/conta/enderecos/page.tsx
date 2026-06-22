import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MapPin, Plus } from "lucide-react";

export default async function EnderecosPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Meus Endereços</h2>
        <button className="btn-primary text-sm py-2">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <MapPin size={40} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Você ainda não tem endereços salvos.</p>
          <p className="text-gray-400 text-xs mt-1">Endereços são salvos automaticamente ao finalizar compras.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-brand-600" />
                    <span className="font-semibold text-gray-900">{addr.name}</span>
                    {addr.isDefault && (
                      <span className="badge bg-green-100 text-green-700 text-xs">Padrão</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {addr.street}, {addr.number}
                    {addr.complement && `, ${addr.complement}`}
                    <br />{addr.district} — {addr.city}/{addr.state}
                    <br />CEP {addr.zipCode}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
