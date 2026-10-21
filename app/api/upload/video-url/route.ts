import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Vídeos vão direto do navegador para o Supabase usando uma URL de upload
// assinada. Passar 100MB pelo servidor (formData guarda tudo na memória)
// arriscava estourar os 512MB da instância do Render.

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "produtos";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Configuração de storage ausente no servidor" }, { status: 500 });
  }

  const { type, size } = (await request.json().catch(() => ({}))) as { type?: string; size?: number };

  const ext = type ? ALLOWED_VIDEO_TYPES[type] : undefined;
  if (!ext) return NextResponse.json({ error: "Formato de vídeo não suportado (use MP4, WebM ou MOV)" }, { status: 400 });
  if (!size || size > MAX_VIDEO_BYTES) return NextResponse.json({ error: "Vídeo muito grande (máx 100MB)" }, { status: 400 });

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const signRes = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${BUCKET}/${filename}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, "x-upsert": "true" },
  });

  if (!signRes.ok) {
    console.error("Supabase sign upload error:", await signRes.text());
    return NextResponse.json({ error: "Erro ao preparar upload. Verifique as configurações do Supabase." }, { status: 500 });
  }

  const { url } = (await signRes.json()) as { url: string };

  return NextResponse.json({
    uploadUrl: `${SUPABASE_URL}/storage/v1${url}`,
    publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`,
  });
}
