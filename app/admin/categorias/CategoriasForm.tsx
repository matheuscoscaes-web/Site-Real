"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Loader2, Check, Trash2, Plus } from "lucide-react";

type Categoria = { id: string; name: string; image: string };

export function CategoriasForm({ initialCategorias }: { initialCategorias: Categoria[] }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(initialCategorias);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newImage, setNewImage] = useState("");
  const [creating, setCreating] = useState(false);

  async function saveName(id: string, name: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, {
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

  async function handleFileChange(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusyId(id);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await upRes.json();
      if (!upRes.ok) {
        setError(upData.error || "Erro no upload");
        return;
      }
      const res = await fetch(`/api/admin/categorias/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: upData.url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao salvar imagem");
        return;
      }
      setCategorias((prev) => prev.map((c) => (c.id === id ? { ...c, image: upData.url } : c)));
      setSavedId(id);
      setTimeout(() => setSavedId((p) => (p === id ? null : p)), 2000);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`Remover a categoria "${name}" da home?\n\nEsta ação não pode ser desfeita.`)) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/categorias/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao remover categoria");
        return;
      }
      setCategorias((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleNewFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setCreating(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro no upload");
        return;
      }
      setNewImage(data.url);
    } finally {
      setCreating(false);
    }
  }

  async function createCategoria() {
    if (!newName.trim()) {
      setError("Informe o nome da nova categoria");
      return;
    }
    if (!newImage) {
      setError("Envie uma imagem para a nova categoria");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), image: newImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar categoria");
        return;
      }
      setCategorias((prev) => [...prev, data]);
      setNewName("");
      setNewImage("");
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categorias.map((cat) => (
          <div key={cat.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <label className="group relative block rounded-xl overflow-hidden h-48 bg-gray-100 cursor-pointer ring-1 ring-gray-200 mb-3">
              <Image src={cat.image} alt={cat.name} fill sizes="300px" className="object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {busyId === cat.id ? (
                  <Loader2 size={22} className="text-white animate-spin" />
                ) : savedId === cat.id ? (
                  <span className="flex items-center gap-1.5 text-white text-sm font-medium bg-green-600/90 px-3 py-1.5 rounded-full">
                    <Check size={14} /> Salvo
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload size={16} /> Trocar imagem
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(cat.id, e)}
                disabled={busyId !== null}
              />
            </label>

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
              <button
                onClick={() => remove(cat.id, cat.name)}
                disabled={busyId !== null}
                title="Remover categoria"
                className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Nova categoria */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm p-4">
          <label className="group relative block rounded-xl overflow-hidden h-48 bg-gray-50 cursor-pointer ring-1 ring-gray-200 mb-3 flex items-center justify-center">
            {newImage ? (
              <Image src={newImage} alt="Nova categoria" fill sizes="300px" className="object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-1.5 text-gray-400 text-sm">
                {creating ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
                Adicionar imagem
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleNewFileChange}
              disabled={creating}
            />
          </label>

          <div className="flex items-center gap-2">
            <input
              placeholder="Nome da categoria"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
              className="input-field py-2 text-sm flex-1"
            />
            <button
              onClick={createCategoria}
              disabled={creating || !newName.trim() || !newImage}
              className="btn-primary py-2 px-3 text-sm flex-shrink-0 disabled:opacity-50"
            >
              Criar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
