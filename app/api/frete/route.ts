import { NextRequest, NextResponse } from "next/server";
import { calcularFrete } from "@/lib/frete";

export async function POST(request: NextRequest) {
  const { cep, totalItems } = await request.json();

  try {
    const options = await calcularFrete(cep, totalItems ?? 1);
    return NextResponse.json(options);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao calcular frete" },
      { status: 400 }
    );
  }
}
