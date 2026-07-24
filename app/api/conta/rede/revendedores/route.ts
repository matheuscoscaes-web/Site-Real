import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "administrador",
  VENDOR: "vendedor",
  RESELLER: "revendedor",
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const role = session.user.role;
  if (role !== "VENDOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const { name, email, password, phone, vendorId, userId } = await req.json();

  if (!userId && !email) {
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

  const existing = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role !== "CUSTOMER") {
      return NextResponse.json(
        { error: `Este e-mail já está cadastrado como ${ROLE_LABELS[existing.role] || existing.role}.` },
        { status: 409 }
      );
    }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "RESELLER",
        phone: phone || existing.phone,
        reseller: { create: { vendorId: resolvedVendorId } },
      },
      include: { reseller: true },
    });
    return NextResponse.json(user, { status: 200 });
  }

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
  }

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
