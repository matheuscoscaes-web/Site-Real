"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify, CATEGORIES, SUBCATEGORIES, COLORS, SIZES } from "@/lib/utils";
import {
  Plus, Trash2, Loader2, Save, Image as ImageIcon, X,
  ChevronUp, ChevronDown, Package, Info, Star, Upload, Video, Images,
} from "lucide-react";
import Image from "next/image";

interface Variant {
  color: string | null;
  size: string | null;
  stock: number;
}

interface ProductData {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  categories?: string[];
  images?: string;
  video?: string | null;
  stock?: number;
  active?: boolean;
  featured?: boolean;
  variants?: Variant[];
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="flex items-center gap-3 font-bold text-gray-900">
          <Icon size={18} className="text-brand-700" />
          {title}
        </span>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

export function ProductForm({ product }: { product?: ProductData }) {
  const router = useRouter();
  const isEdit = !!product?.id;

  // Cada linha é uma cor: foto principal + fotos extras (mais de uma imagem
  // pra mesma cor) + tamanho + estoque, tudo junto.
  type Row = { color: string; main: string; extra: string[]; size: string; stock: number };

  function parseFormImages(raw?: string): { url: string; color: string }[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) =>
        typeof item === "string" ? { url: item, color: "" } : { url: item.url || "", color: item.color || "" }
      );
    } catch { return []; }
  }

  function buildInitialRows(): Row[] {
    const images = parseFormImages(product?.images);
    const variants = product?.variants ?? [];

    // Agrupa as fotos por cor, preservando a ordem de primeira aparição
    const groups: { color: string; urls: string[] }[] = [];
    for (const img of images) {
      const color = img.color || "";
      let g = groups.find((g) => g.color === color);
      if (!g) { g = { color, urls: [] }; groups.push(g); }
      if (img.url) g.urls.push(img.url);
    }

    if (variants.length > 0) {
      const usedColors = new Set<string>();
      const rows: Row[] = variants.map((v) => {
        const color = v.color ?? "";
        let main = "";
        let extra: string[] = [];
        if (color && !usedColors.has(color)) {
          const g = groups.find((g) => g.color === color);
          if (g && g.urls.length > 0) { [main, ...extra] = g.urls; }
          usedColors.add(color);
        }
        return { color, main, extra, size: v.size ?? "", stock: v.stock ?? 0 };
      });
      groups.forEach((g) => {
        if (!usedColors.has(g.color) && g.urls.length > 0) {
          const [main, ...extra] = g.urls;
          rows.push({ color: g.color, main, extra, size: "", stock: 0 });
        }
      });
      return rows;
    }

    if (groups.length > 0) {
      return groups.map((g) => {
        const [main, ...extra] = g.urls;
        return { color: g.color, main: main || "", extra, size: "", stock: 0 };
      });
    }

    return [{ color: "", main: "", extra: [], size: "", stock: product?.stock ?? 0 }];
  }

  const [form, setForm] = useState({
    name: product?.name || "",
    slug: product?.slug || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    stock: product?.stock?.toString() || "0",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
    video: product?.video || "",
  });

  const [categories, setCategories] = useState<string[]>(
    product?.categories && product.categories.length > 0 ? product.categories : [CATEGORIES[0]]
  );
  const [rows, setRows] = useState<Row[]>(buildInitialRows());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadingMulti, setUploadingMulti] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  function set(field: string, value: string | boolean) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function handleNameChange(name: string) {
    const lower = name.trim().toLowerCase();
    const autoCategory = lower.startsWith("bolsa") ? "Bolsas" : null;
    setForm((p) => ({
      ...p,
      name,
      ...(!isEdit && { slug: slugify(name) }),
    }));
    if (autoCategory && !isEdit) {
      setCategories((p) => (p.includes(autoCategory) ? p : [...p, autoCategory]));
    }
  }

  function toggleCategory(cat: string) {
    setCategories((p) => (p.includes(cat) ? p.filter((c) => c !== cat) : [...p, cat]));
  }

  // Linhas (cor + fotos + tamanho + estoque)
  function addRow() { setRows((p) => [...p, { color: "", main: "", extra: [], size: "", stock: 0 }]); }
  function updateRow(i: number, field: "color" | "size", val: string) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  }
  function updateStock(i: number, val: number) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, stock: val } : r));
  }
  function removeRow(i: number) { setRows((p) => p.filter((_, idx) => idx !== i)); }
  function moveRow(i: number, dir: -1 | 1) {
    const arr = [...rows];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setRows(arr);
  }

  function setMainImage(i: number, url: string) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, main: url } : r));
  }
  function addExtraSlot(i: number) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, extra: [...r.extra, ""] } : r));
  }
  function updateExtraImage(i: number, j: number, url: string) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, extra: r.extra.map((u, k) => k === j ? url : u) } : r));
  }
  function removeExtraImage(i: number, j: number) {
    setRows((p) => p.map((r, idx) => idx === i ? { ...r, extra: r.extra.filter((_, k) => k !== j) } : r));
  }

  // Upload da foto principal de uma linha
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `main-${index}`;
    setUploadingKey(key);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingKey(null);
    if (!res.ok) { setUploadError(data.error || "Erro no upload"); return; }
    setMainImage(index, data.url);
    e.target.value = "";
  }

  // Upload de uma foto extra (adiciona um slot novo na hora do upload)
  async function handleExtraFileUpload(e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, extraIndex: number) {
    const file = e.target.files?.[0];
    if (!file) return;
    const key = `extra-${rowIndex}-${extraIndex}`;
    setUploadingKey(key);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingKey(null);
    if (!res.ok) { setUploadError(data.error || "Erro no upload"); return; }
    updateExtraImage(rowIndex, extraIndex, data.url);
    e.target.value = "";
  }

  // Upload de várias fotos de uma vez (sem cor — só fotos extras do produto)
  async function handleMultiFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingMulti(true);
    setUploadError("");

    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Erro no upload"); continue; }
      setRows((p) => [...p, { color: "", main: data.url, extra: [], size: "", stock: 0 }]);
    }

    setUploadingMulti(false);
    e.target.value = "";
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingVideo(false);
    if (!res.ok) { setUploadError(data.error || "Erro no upload"); return; }
    set("video", data.url);
    e.target.value = "";
  }

  // Calcula estoque total a partir das linhas de cor/estoque
  function syncStockFromRows() {
    const total = rows.reduce((s, r) => s + (r.stock || 0), 0);
    setForm((p) => ({ ...p, stock: total.toString() }));
  }

  // Todas as fotos de uma linha (principal + extras), na ordem certa
  function rowImages(r: Row) {
    return [r.main, ...r.extra].filter((u) => u.trim());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const allImages = rows.flatMap((r) => rowImages(r).map((url) => ({ url, color: r.color })));
    if (allImages.length === 0) {
      setError("Adicione pelo menos uma imagem.");
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      setError("Informe um preço válido.");
      return;
    }
    if (categories.length === 0) {
      setError("Selecione pelo menos uma categoria.");
      return;
    }

    setLoading(true);

    const body = {
      ...form,
      categories,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      video: form.video.trim() || null,
      images: JSON.stringify(allImages),
      variants: rows
        .filter((r) => r.color || r.size)
        .map((r) => ({ color: r.color || null, size: r.size || null, stock: r.stock || 0 })),
    };

    const url = isEdit ? `/api/produtos/${product!.id}` : "/api/produtos";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar produto. Tente novamente.");
      return;
    }

    setSuccess(isEdit ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!");
    setTimeout(() => router.push("/admin/produtos"), 1200);
  }

  const previewImages = rows.flatMap((r) => rowImages(r).map((url) => ({ url, color: r.color })));

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5">{success}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna principal */}
        <div className="xl:col-span-2 space-y-5">

          {/* INFORMAÇÕES BÁSICAS */}
          <Section title="Informações Básicas" icon={Info}>
            <div>
              <label className="label">Nome do produto *</label>
              <input
                className="input-field"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="Ex: Bolsa de Couro Caramelo Premium"
              />
            </div>

            <div>
              <label className="label">
                Slug (URL do produto)
                <span className="text-xs text-gray-400 font-normal ml-2">gerado automaticamente</span>
              </label>
              <input
                className="input-field bg-gray-50 text-gray-500 text-sm font-mono"
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="bolsa-couro-caramelo-premium"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL: /produtos/<strong>{form.slug || "slug-do-produto"}</strong>
              </p>
            </div>

            <div>
              <label className="label">Descrição completa *</label>
              <textarea
                className="input-field min-h-[140px] resize-y"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
                placeholder="Descreva detalhes do material, acabamento, dimensões, uso recomendado..."
              />
              <p className="text-xs text-gray-400 mt-1">{form.description.length} caracteres</p>
            </div>

            <div>
              <label className="label">Categorias *</label>
              <p className="text-xs text-gray-400 -mt-0.5 mb-1.5">Pode marcar mais de uma.</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => {
                  const checked = categories.includes(c);
                  return (
                    <label
                      key={c}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                        checked ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleCategory(c)} />
                      {c}
                    </label>
                  );
                })}
              </div>

              {/* Subcategorias — só aparecem quando a categoria pai está marcada */}
              {CATEGORIES.filter((c) => categories.includes(c) && SUBCATEGORIES[c]).map((c) => (
                <div key={c} className="mt-3 pl-3 border-l-2 border-gray-100">
                  <p className="text-xs text-gray-400 mb-1.5">Seção de {c}</p>
                  <div className="flex flex-wrap gap-2">
                    {SUBCATEGORIES[c].map((sub) => {
                      const checked = categories.includes(sub);
                      return (
                        <label
                          key={sub}
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                            checked ? "bg-brand-700 border-brand-700 text-white" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <input type="checkbox" className="hidden" checked={checked} onChange={() => toggleCategory(sub)} />
                          {sub}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* FOTOS, COR E ESTOQUE */}
          <Section title="Fotos, Cor e Estoque" icon={ImageIcon}>
            <p className="text-xs text-gray-500 -mt-1 mb-2">
              Cada linha é uma cor: foto principal, fotos extras dessa mesma cor (clique no "+" ao lado da foto), tamanho e estoque. A primeira linha é a foto principal do produto.
            </p>
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{uploadError}</div>
            )}

            {/* Preview geral das fotos */}
            {previewImages.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {previewImages.map((img, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 flex-shrink-0">
                    <Image
                      src={img.url}
                      alt={img.color || `Foto ${i + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://picsum.photos/200"; }}
                    />
                    {i === 0 && (
                      <span className="absolute top-0.5 left-0.5 bg-brand-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        Principal
                      </span>
                    )}
                    {img.color && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center py-0.5 truncate px-1">
                        {img.color}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex flex-col gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <button type="button" onClick={() => moveRow(i, -1)} disabled={i === 0} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                        <ChevronUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1} className="p-1 text-gray-300 hover:text-gray-600 disabled:opacity-20 transition-colors">
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Foto principal + fotos extras, lado a lado */}
                    <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                      <label className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-brand-200 cursor-pointer group" title="Foto principal desta cor">
                        {r.main ? (
                          <Image src={r.main} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                        ) : (
                          <ImageIcon size={18} className="text-gray-300 absolute inset-0 m-auto" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                          {uploadingKey === `main-${i}` ? (
                            <Loader2 size={16} className="animate-spin text-white" />
                          ) : (
                            <Upload size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                        <input type="file" accept="image/*,image/webp" className="hidden" onChange={(e) => handleFileUpload(e, i)} disabled={uploadingKey !== null} />
                      </label>

                      {r.extra.map((url, j) => (
                        <div key={j} className="relative w-11 h-11 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group">
                          {url ? (
                            <Image src={url} alt="" fill className="object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
                          ) : (
                            <ImageIcon size={14} className="text-gray-300 absolute inset-0 m-auto" />
                          )}
                          <label className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center cursor-pointer transition-colors" title="Trocar foto extra">
                            {uploadingKey === `extra-${i}-${j}` ? (
                              <Loader2 size={14} className="animate-spin text-white" />
                            ) : (
                              <Upload size={12} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                            <input type="file" accept="image/*,image/webp" className="hidden" onChange={(e) => handleExtraFileUpload(e, i, j)} disabled={uploadingKey !== null} />
                          </label>
                          <button
                            type="button"
                            onClick={() => removeExtraImage(i, j)}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] leading-none"
                            title="Remover foto extra"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}

                      <label className="w-11 h-11 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-brand-300 hover:text-brand-500 cursor-pointer flex-shrink-0 transition-colors" title="Adicionar foto extra desta cor">
                        {uploadingKey === `extra-${i}-${r.extra.length}` ? (
                          <Loader2 size={14} className="animate-spin text-brand-500" />
                        ) : (
                          <Plus size={16} />
                        )}
                        <input
                          type="file"
                          accept="image/*,image/webp"
                          className="hidden"
                          disabled={uploadingKey !== null}
                          onChange={(e) => {
                            const extraIndex = r.extra.length;
                            addExtraSlot(i);
                            handleExtraFileUpload(e, i, extraIndex);
                          }}
                        />
                      </label>
                    </div>

                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(i)} className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-1.5 pl-1">
                    <div className="flex-1 min-w-0">
                      <input
                        list={`cores-${i}`}
                        className="input-field w-full text-xs py-1.5 text-gray-600"
                        value={r.color}
                        onChange={(e) => updateRow(i, "color", e.target.value)}
                        placeholder="Cor (ex: Preto, Caramelo, Rosé)"
                      />
                      <datalist id={`cores-${i}`}>
                        {COLORS.map((c) => <option key={c} value={c} />)}
                      </datalist>
                    </div>
                    <div className="flex gap-1.5">
                      <select
                        className="input-field text-xs py-1.5 text-gray-600 flex-1 min-w-0 sm:w-24 sm:flex-none"
                        value={r.size}
                        onChange={(e) => updateRow(i, "size", e.target.value)}
                      >
                        <option value="">— Tam. —</option>
                        {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <input
                        type="number"
                        min="0"
                        title="Estoque desta cor"
                        className={`input-field text-xs py-1.5 font-bold text-center flex-1 min-w-0 sm:w-16 sm:flex-none ${r.stock === 0 ? "border-red-200 bg-red-50 text-red-700" : r.stock <= 3 ? "border-orange-200 bg-orange-50 text-orange-700" : "text-green-700"}`}
                        value={r.stock}
                        onChange={(e) => updateStock(i, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button type="button" onClick={addRow} className="btn-ghost text-brand-700 text-sm flex-1 justify-center border border-dashed border-brand-200 py-2.5 rounded-xl hover:bg-brand-50">
                <Plus size={16} /> Adicionar cor
              </button>
              <label className={`btn-ghost text-brand-700 text-sm flex-1 justify-center border border-dashed border-brand-200 py-2.5 rounded-xl hover:bg-brand-50 cursor-pointer ${uploadingMulti ? "opacity-60 pointer-events-none" : ""}`}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFileUpload} disabled={uploadingMulti} />
                {uploadingMulti ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : <><Images size={16} /> Adicionar várias fotos</>}
              </label>
            </div>

            <div className="flex items-center justify-between p-3 bg-brand-50 rounded-xl border border-brand-100">
              <span className="text-sm font-medium text-brand-800">Total por cor:</span>
              <span className="text-base font-bold text-brand-700">
                {rows.reduce((s, r) => s + (r.stock || 0), 0)} unidades
              </span>
              <button
                type="button"
                onClick={syncStockFromRows}
                className="text-xs text-brand-600 hover:underline font-medium"
              >
                Somar no total
              </button>
            </div>
          </Section>

          {/* VÍDEO DO PRODUTO */}
          <Section title="Vídeo do Produto" icon={Video} defaultOpen={false}>
            <p className="text-xs text-gray-500 -mt-1 mb-2">
              Opcional. Um vídeo curto mostrando o produto (MP4, WebM ou MOV, máx 50MB).
            </p>
            {uploadError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{uploadError}</div>
            )}

            {form.video && (
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-black max-w-xs">
                <video src={form.video} controls className="w-full max-h-64" />
                <button
                  type="button"
                  onClick={() => set("video", "")}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  aria-label="Remover vídeo"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                className="input-field flex-1 min-w-0 text-sm py-2"
                value={form.video}
                onChange={(e) => set("video", e.target.value)}
                placeholder="Cole uma URL ou use o botão de upload →"
              />
              <label className={`flex-shrink-0 p-2.5 rounded-lg border transition-colors cursor-pointer ${uploadingVideo ? "bg-gray-100 border-gray-200" : "bg-brand-50 border-brand-200 hover:bg-brand-100 text-brand-700"}`} title="Fazer upload de vídeo">
                <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoUpload} disabled={uploadingVideo} />
                {uploadingVideo ? <Loader2 size={15} className="animate-spin text-gray-400" /> : <Upload size={15} />}
              </label>
            </div>
          </Section>

        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">

          {/* Publicar */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={16} className="text-brand-700" /> Publicação
            </h3>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer mb-3 transition-colors">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.active ? "bg-green-500" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.active ? "left-5" : "left-1"}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Produto ativo</p>
                <p className="text-xs text-gray-400">{form.active ? "Visível na loja" : "Oculto da loja"}</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-brand-600" : "bg-gray-300"}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.featured ? "left-5" : "left-1"}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <Star size={12} className="text-amber-500" /> Destaque
                </p>
                <p className="text-xs text-gray-400">Aparece na página inicial</p>
              </div>
            </label>
          </div>

          {/* Preço */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Preço</h3>

            <div className="space-y-3">
              <div>
                <label className="label">Preço de venda (R$) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field pl-10 font-bold text-lg text-brand-700"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    required
                    placeholder="0,00"
                  />
                </div>
              </div>

              {form.price && parseFloat(form.price) > 0 && (
                <div className="p-3 bg-gray-50 rounded-xl space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Preço cheio (antes do desconto):</span>
                    <span className="font-semibold">R$ {(parseFloat(form.price) * 1.2).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>10x sem juros:</span>
                    <span className="font-semibold">R$ {(parseFloat(form.price) / 10).toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between text-green-700">
                    <span>Desconto 5% PIX:</span>
                    <span className="font-semibold">R$ {(parseFloat(form.price) * 0.95).toFixed(2).replace(".", ",")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Estoque total */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Estoque Total</h3>
            <div>
              <label className="label">Quantidade total *</label>
              <input
                type="number"
                min="0"
                className="input-field font-bold text-center text-lg"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-center">
                Ou clique em <span className="text-brand-600 font-medium">"Somar no total"</span> na seção de variações
              </p>
            </div>
            <div className={`mt-3 text-center text-sm font-semibold py-2 rounded-xl ${
              parseInt(form.stock) === 0 ? "bg-red-50 text-red-700" :
              parseInt(form.stock) <= 5 ? "bg-orange-50 text-orange-700" :
              "bg-green-50 text-green-700"
            }`}>
              {parseInt(form.stock) === 0 ? "⚠ Produto esgotado" :
               parseInt(form.stock) <= 5 ? `⚠ Estoque baixo (${form.stock} restantes)` :
               `✓ Em estoque (${form.stock} unidades)`}
            </div>
          </div>

          {/* Salvar */}
          <div className="space-y-3">
            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Salvando...</>
                : <><Save size={18} /> {isEdit ? "Salvar alterações" : "Criar produto"}</>
              }
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/produtos")}
              className="btn-outline w-full"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
