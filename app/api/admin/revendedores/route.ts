import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");

  const resellers = await prisma.reseller.findMany({
    where: vendorId ? { vendorId } : undefined,
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
      vendor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(resellers);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { name, email, password, phone, vendorId } = await req.json();

  if (!name || !email || !password || !vendorId) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (!vendor) return NextResponse.json({ error: "Vendedor não encontrado" }, { status: 404 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone: phone || null,
      role: "RESELLER",
      reseller: { create: { vendorId } },
    },
    include: { reseller: true },
  });

  return NextResponse.json(user, { status: 201 });
}
