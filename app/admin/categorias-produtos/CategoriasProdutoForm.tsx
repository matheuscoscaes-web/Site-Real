"use client";

import { useState } from "react";
import { Loader2, Check, Trash2, Plus } from "lucide-react";

type Categoria = { id: string; name: string; parentId: string | null };

export function CategoriasProdutoForm({ initialCategorias }: { initialCategorias: Categoria[] }) {
  const [categorias, setCategorias] = useState(initialCategorias);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [creating, setCreating] = useState(false);

  const parents = categorias.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categorias.filter((c) => c.parentId === id);

  async function saveName(id: string, name: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/categorias-produtos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar categoria");
        return;
      }
      setSavedId(id);
      setTimeout(() => setSavedId((p) => (p === id ? null : p)), 2000);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(cat: Categoria) {
    const hasChildren = childrenOf(cat.id).length > 0;
    const msg = hasChildren
      ? `Remover a categoria "${cat.name}"? Isso também remove suas subcategorias.\n\nEsta ação não pode ser desfeita.`
      : `Remover a categoria "${cat.name}"?\n\nEsta ação não pode ser desfeita.`;
    if (!confirm(msg)) return;

    setBusyId(cat.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/categorias-produtos/${cat.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao remover categoria");
        return;
      }
      setCategorias((prev) => prev.filter((c) => c.id !== cat.id && c.parentId !== cat.id));
    } finally {
      setBusyId(null);
    }
  }

  async function createCategoria() {
    if (!newName.trim()) {
      setError("Informe o nome da nova categoria");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categorias-produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), parentId: newParentId || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar categoria");
        return;
      }
      setCategorias((prev) => [...prev, data]);
      setNewName("");
      setNewParentId("");
    } finally {
      setCreating(false);
    }
  }

  function NameField({ cat }: { cat: Categoria }) {
    return (
      <div className="flex items-center gap-2">
        <input
          defaultValue={cat.name}
          disabled={busyId === cat.id}
          onBlur={(e) => {
            const name = e.target.value.trim();
            if (name && name !== cat.name) {
              setCategorias((prev) => prev.map((c) => (c.id === cat.id ? { ...c, name } : c)));
              saveName(cat.id, name);
            } else {
              e.target.value = cat.name;
            }
          }}
          className="input-field py-2 text-sm flex-1"
        />
        {busyId === cat.id ? (
          <Loader2 size={16} className="text-gray-400 animate-spin flex-shrink-0" />
        ) : savedId === cat.id ? (
          <Check size={16} className="text-green-600 flex-shrink-0" />
        ) : null}
        <button
          onClick={() => remove(cat)}
          disabled={busyId !== null}
          title="Remover categoria"
          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
        {parents.map((cat) => (
          <div key={cat.id} className="p-4 space-y-3">
            <NameField cat={cat} />
            {childrenOf(cat.id).length > 0 && (
              <div className="pl-6 border-l-2 border-gray-100 space-y-2">
                {childrenOf(cat.id).map((child) => (
                  <NameField key={child.id} cat={child} />
                ))}
              </div>
            )}
          </div>
        ))}

        {parents.length === 0 && (
          <p className="p-4 text-sm text-gray-400">Nenhuma categoria cadastrada ainda.</p>
        )}
      </div>

      {/* Nova categoria */}
      <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm p-4 mt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Nova categoria</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="Nome da categoria"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={creating}
            className="input-field py-2 text-sm flex-1 min-w-[160px]"
          />
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            disabled={creating}
            className="input-field py-2 text-sm w-56"
          >
            <option value="">Categoria principal</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>Subcategoria de {p.name}</option>
            ))}
          </select>
          <button
            onClick={createCategoria}
            disabled={creating || !newName.trim()}
            className="btn-primary py-2 px-3 text-sm flex-shrink-0 disabled:opacity-50"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
