import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: { isDefault: "desc" },
  });
  return NextResponse.json(addresses);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, street, number, complement, district, city, state, zipCode } = body;

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      name: name || "Casa",
      street,
      number,
      complement: complement || "",
      district,
      city,
      state,
      zipCode,
      isDefault: false,
    },
  });
  return NextResponse.json(address, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID não informado" }, { status: 400 });

  await prisma.address.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
