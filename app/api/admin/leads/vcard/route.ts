import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function escapeVCardText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const leads = await prisma.whatsappLead.findMany({ orderBy: { createdAt: "desc" } });

  const vcards = leads.map((lead) => {
    const name = escapeVCardText(lead.name);
    const digits = lead.phone.replace(/\D/g, "");
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      `TEL;TYPE=CELL:+55${digits}`,
      "END:VCARD",
    ].join("\r\n");
  });

  const body = vcards.join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard",
      "Content-Disposition": `inline; filename="grupo-vip-whatsapp.vcf"`,
    },
  });
}
