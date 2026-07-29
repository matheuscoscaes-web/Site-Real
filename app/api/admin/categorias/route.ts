import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const categorias = await prisma.homeCategory.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(categorias);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const image = String(body.image ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  }
  if (!image) {
    return NextResponse.json({ error: "Informe a imagem da categoria" }, { status: 400 });
  }

  const last = await prisma.homeCategory.findFirst({ orderBy: { position: "desc" } });
  const categoria = await prisma.homeCategory.create({
    data: { name, image, position: (last?.position ?? 0) + 1 },
  });

  return NextResponse.json(categoria, { status: 201 });
}
