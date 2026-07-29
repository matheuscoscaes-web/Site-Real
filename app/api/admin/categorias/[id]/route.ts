import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data: { name?: string; image?: string } = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.image !== undefined) {
    const image = String(body.image).trim();
    if (!image) {
      return NextResponse.json({ error: "Informe a imagem da categoria" }, { status: 400 });
    }
    data.image = image;
  }

  const categoria = await prisma.homeCategory.update({ where: { id }, data });
  return NextResponse.json(categoria);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.homeCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
