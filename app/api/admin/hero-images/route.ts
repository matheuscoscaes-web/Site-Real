import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const images = await prisma.heroImage.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(images);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const position = parseInt(body.position, 10);
  const url = String(body.url ?? "").trim();

  if (![1, 2, 3, 4].includes(position)) {
    return NextResponse.json({ error: "Posição inválida" }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "Informe a URL da imagem" }, { status: 400 });
  }

  await prisma.heroImage.upsert({
    where: { position },
    update: { url },
    create: { position, url },
  });

  return NextResponse.json({ ok: true });
}
