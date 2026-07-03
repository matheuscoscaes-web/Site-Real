import { formatCurrency } from "./utils";

interface OrderForEmail {
  id: string;
  total: number;
  shippingCarrier: string | null;
  items: { quantity: number; price: number; color: string | null; size: string | null; product: { name: string } }[];
  address: { street: string; number: string; district: string; city: string; state: string } | null;
  user: { name: string; email: string };
}

const SITE_URL = process.env.NEXT_PUBLIC_URL ?? "https://heartscouro.com.br";
const BRAND = "#955707";

function wrapper(title: string, bodyHtml: string) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#f9f3e8; padding:32px 16px;">
    <div style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #f0e6d2;">
      <div style="background:${BRAND}; padding:24px 28px;">
        <h1 style="color:#fff; font-size:20px; margin:0;">Hearts Couro</h1>
      </div>
      <div style="padding:28px;">
        <h2 style="color:#1c1c1c; font-size:18px; margin:0 0 12px;">${title}</h2>
        ${bodyHtml}
        <p style="margin-top:28px;">
          <a href="${SITE_URL}/conta/pedidos" style="background:${BRAND}; color:#fff; text-decoration:none; padding:12px 24px; border-radius:999px; font-weight:bold; font-size:14px; display:inline-block;">
            Acompanhar meu pedido
          </a>
        </p>
      </div>
    </div>
  </div>`;
}

function itemsList(order: OrderForEmail) {
  return `
    <ul style="list-style:none; padding:0; margin:0 0 16px; border-top:1px solid #eee;">
      ${order.items.map((item) => `
        <li style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee; font-size:14px; color:#333;">
          <span>${item.product.name}${item.color ? ` • ${item.color}` : ""}${item.size ? ` • ${item.size}` : ""} × ${item.quantity}</span>
          <strong>${formatCurrency(item.price * item.quantity)}</strong>
        </li>
      `).join("")}
    </ul>
  `;
}

export function orderConfirmedEmail(order: OrderForEmail) {
  return {
    subject: `Pagamento confirmado — pedido #${order.id.slice(-8).toUpperCase()}`,
    html: wrapper(
      `Recebemos seu pagamento! 🎉`,
      `
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Olá, ${order.user.name.split(" ")[0]}! Seu pagamento do pedido <strong>#${order.id.slice(-8).toUpperCase()}</strong> foi confirmado e já estamos preparando tudo com carinho.
        </p>
        ${itemsList(order)}
        <p style="font-size:15px; font-weight:bold; text-align:right; margin:0 0 16px;">Total: ${formatCurrency(order.total)}</p>
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Assim que seu pedido for postado, você recebe um novo e-mail com a confirmação de envio — ou pode acompanhar o status a qualquer momento pelo site, na área "Meus Pedidos".
        </p>
      `
    ),
  };
}

export function orderShippedEmail(order: OrderForEmail) {
  const isPickup = order.shippingCarrier === "Loja";
  return {
    subject: `Pedido a caminho — #${order.id.slice(-8).toUpperCase()}`,
    html: wrapper(
      isPickup ? "Seu pedido está pronto para retirada! 📦" : "Seu pedido foi enviado! 📦",
      `
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Olá, ${order.user.name.split(" ")[0]}! ${
            isPickup
              ? "Seu pedido já está pronto pra você buscar na loja."
              : `Seu pedido <strong>#${order.id.slice(-8).toUpperCase()}</strong> já saiu pra entrega${order.address ? ` para ${order.address.city}/${order.address.state}` : ""}.`
          }
        </p>
        ${itemsList(order)}
        <p style="color:#555; font-size:14px; line-height:1.6;">
          Você pode acompanhar todos os detalhes do pedido pelo site, na área "Meus Pedidos".
        </p>
      `
    ),
  };
}
