import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ME_URL = "https://melhorenvio.com.br/api/v2/me";

const ME_HEADERS = {
  Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "User-Agent": "HeartsCouro/1.0 (ffernandoccaio2004@gmail.com)",
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      address: true,
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  if (!order.shippingServiceId) {
    return NextResponse.json({ error: "Pedido sem serviço de frete selecionado" }, { status: 400 });
  }

  const env = {
    token: process.env.MELHOR_ENVIO_TOKEN,
    cepOrigem: process.env.MELHOR_ENVIO_CEP_ORIGEM?.replace(/\D/g, ""),
    logradouro: process.env.MELHOR_ENVIO_LOGRADOURO_ORIGEM,
    numero: process.env.MELHOR_ENVIO_NUMERO_ORIGEM,
    bairro: process.env.MELHOR_ENVIO_BAIRRO_ORIGEM,
    cidade: process.env.MELHOR_ENVIO_CIDADE_ORIGEM,
    uf: process.env.MELHOR_ENVIO_UF_ORIGEM,
    nome: process.env.MELHOR_ENVIO_NOME ?? "Hearts Couro",
    telefone: process.env.MELHOR_ENVIO_TELEFONE,
    documento: process.env.MELHOR_ENVIO_DOCUMENTO,
  };

  if (!env.token || !env.cepOrigem) {
    return NextResponse.json({ error: "Melhor Envio não configurado" }, { status: 500 });
  }

  const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

  // 1. Adicionar ao carrinho ME
  const cartBody = {
    service: order.shippingServiceId,
    from: {
      name: env.nome,
      phone: env.telefone ?? "",
      email: "ffernandoccaio2004@gmail.com",
      document: env.documento ?? "",
      address: env.logradouro ?? "",
      number: env.numero ?? "",
      district: env.bairro ?? "",
      city: env.cidade ?? "",
      country_id: "BR",
      postal_code: env.cepOrigem,
      state_abbr: env.uf ?? "",
    },
    to: {
      name: order.user.name,
      phone: order.user.phone ?? "",
      email: order.user.email,
      document: "",
      address: order.address.street,
      number: order.address.number,
      complement: order.address.complement ?? "",
      district: order.address.district,
      city: order.address.city,
      country_id: "BR",
      postal_code: order.address.zipCode.replace(/\D/g, ""),
      state_abbr: order.address.state,
    },
    products: order.items.map((item) => ({
      name: item.product.name,
      quantity: item.quantity,
      unitary_value: item.price,
    })),
    volumes: [
      {
        height: 11 * totalItems,
        width: 30,
        length: 32,
        weight: totalItems,
      },
    ],
    options: {
      insurance_value: order.total,
      receipt: false,
      own_hand: false,
    },
  };

  const cartRes = await fetch(`${ME_URL}/cart`, {
    method: "POST",
    headers: ME_HEADERS,
    body: JSON.stringify(cartBody),
  });

  if (!cartRes.ok) {
    const err = await cartRes.text();
    return NextResponse.json({ error: `Erro ao adicionar ao carrinho ME: ${err}` }, { status: 500 });
  }

  const cartData = await cartRes.json();
  const meOrderId: string = cartData.id;

  // 2. Checkout (debita da carteira ME)
  const checkoutRes = await fetch(`${ME_URL}/shipment/checkout`, {
    method: "POST",
    headers: ME_HEADERS,
    body: JSON.stringify({ orders: [meOrderId] }),
  });

  if (!checkoutRes.ok) {
    const err = await checkoutRes.text();
    return NextResponse.json(
      { error: `Erro no checkout ME (verifique saldo da carteira): ${err}` },
      { status: 500 }
    );
  }

  // 3. Gerar etiqueta
  const generateRes = await fetch(`${ME_URL}/shipment/generate`, {
    method: "POST",
    headers: ME_HEADERS,
    body: JSON.stringify({ orders: [meOrderId] }),
  });

  if (!generateRes.ok) {
    const err = await generateRes.text();
    return NextResponse.json({ error: `Erro ao gerar etiqueta ME: ${err}` }, { status: 500 });
  }

  // 4. URL de impressão
  const printRes = await fetch(`${ME_URL}/shipment/print`, {
    method: "POST",
    headers: ME_HEADERS,
    body: JSON.stringify({ mode: "public", orders: [meOrderId] }),
  });

  if (!printRes.ok) {
    const err = await printRes.text();
    return NextResponse.json({ error: `Erro ao obter URL de impressão ME: ${err}` }, { status: 500 });
  }

  const printData = await printRes.json();

  // Salva o ID do ME no pedido
  await prisma.order.update({
    where: { id },
    data: { melhorEnvioId: meOrderId, status: "PREPARING" },
  });

  return NextResponse.json({ url: printData.url, meOrderId });
}
