import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role;
  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { name, email, password, phone, vendorId } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

  let resolvedVendorId: string;
  if (role === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({ where: { userId: session.user.id } });
    if (!vendor) return NextResponse.json({ error: "Perfil de vendedor não encontrado" }, { status: 404 });
    resolvedVendorId = vendor.id;
  } else {
    if (!vendorId) return NextResponse.json({ error: "Vendedor obrigatório" }, { status: 400 });
    resolvedVendorId = vendorId;
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      phone: phone || null,
      role: "RESELLER",
      reseller: { create: { vendorId: resolvedVendorId } },
    },
    include: { reseller: true },
  });

  return NextResponse.json(user, { status: 201 });
}
