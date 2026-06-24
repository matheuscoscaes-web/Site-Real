import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import sharp from "sharp";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = "produtos";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ error: "Configuração de storage ausente no servidor" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Apenas imagens são permitidas" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Arquivo muito grande (máx 10MB)" }, { status: 400 });

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Converte para WebP: redimensiona para no máximo 1200px, fundo branco, qualidade 85
  const webpBuffer = await sharp(rawBuffer)
    .flatten({ background: { r: 249, g: 250, b: 251 } }) // fundo #F9FAFB (gray-50)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "image/webp",
      "x-upsert": "true",
    },
    body: new Uint8Array(webpBuffer),
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    console.error("Supabase upload error:", err);
    return NextResponse.json({ error: "Erro ao fazer upload. Verifique as configurações do Supabase." }, { status: 500 });
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
  return NextResponse.json({ url: publicUrl });
}
