"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, StickyNote } from "lucide-react";

export function NotesForm({ userId, currentNotes }: { userId: string; currentNotes: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState(currentNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/clientes/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
        <StickyNote size={16} className="text-brand-600" /> Notas internas
      </h3>
      <textarea
        className="input-field text-sm min-h-[100px] resize-y"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Adicione observações internas sobre este cliente..."
      />
      <button onClick={handleSave} disabled={saving} className="btn-primary text-sm mt-3 py-2">
        {saving ? "Salvando..." : saved ? "✓ Salvo!" : <><Save size={15} /> Salvar nota</>}
      </button>
    </div>
  );
}
