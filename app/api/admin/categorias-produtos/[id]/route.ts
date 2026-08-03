import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  }

  const existing = await prisma.productCategory.findFirst({ where: { name, NOT: { id } } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 400 });
  }

  const categoria = await prisma.productCategory.update({ where: { id }, data: { name } });

  revalidateTag("product-categories", "max");
  return NextResponse.json(categoria);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.productCategory.delete({ where: { id } });

  revalidateTag("product-categories", "max");
  return NextResponse.json({ ok: true });
}
