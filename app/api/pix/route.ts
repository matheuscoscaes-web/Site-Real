import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { gerarPixEMV } from "@/lib/pix";

export async function POST(request: NextRequest) {
  const { valor, txid } = await request.json();

  const chave = process.env.PIX_CHAVE;
  const nome = process.env.PIX_NOME ?? "Hearts Couro";
  const cidade = process.env.PIX_CIDADE ?? "Rio de Janeiro";

  if (!chave) {
    return NextResponse.json({ error: "PIX não configurado" }, { status: 500 });
  }

  const emv = gerarPixEMV({ chave, nome, cidade, valor, txid });
  const qrBase64 = await QRCode.toDataURL(emv, { width: 300, margin: 2 });

  return NextResponse.json({ emv, qrBase64 });
}
