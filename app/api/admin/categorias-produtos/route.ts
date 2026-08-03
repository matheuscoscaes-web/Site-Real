import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidateTag } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const categorias = await prisma.productCategory.findMany({ orderBy: { position: "asc" } });
  return NextResponse.json(categorias);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const parentId = body.parentId ? String(body.parentId).trim() : null;

  if (!name) {
    return NextResponse.json({ error: "Informe o nome da categoria" }, { status: 400 });
  }

  if (parentId) {
    const parent = await prisma.productCategory.findUnique({ where: { id: parentId } });
    if (!parent) {
      return NextResponse.json({ error: "Categoria pai não encontrada" }, { status: 400 });
    }
    if (parent.parentId) {
      return NextResponse.json({ error: "Não é possível criar uma subcategoria dentro de outra subcategoria" }, { status: 400 });
    }
  }

  const existing = await prisma.productCategory.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: "Já existe uma categoria com esse nome" }, { status: 400 });
  }

  const last = await prisma.productCategory.findFirst({
    where: { parentId },
    orderBy: { position: "desc" },
  });

  const categoria = await prisma.productCategory.create({
    data: { name, parentId, position: (last?.position ?? -1) + 1 },
  });

  revalidateTag("product-categories", "max");
  return NextResponse.json(categoria, { status: 201 });
}
