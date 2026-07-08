import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";

export class InsufficientStockError extends Error {
  constructor(public productName: string) {
    super(`Estoque insuficiente para "${productName}"`);
  }
}

export interface StockItem {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
}

/**
 * Desconta estoque de forma atomica (UPDATE ... WHERE stock >= quantity), pra
 * duas compras simultaneas da ultima unidade nao passarem as duas. Lanca
 * InsufficientStockError e reverte a transacao se nao tiver estoque suficiente.
 */
export async function decrementStockForItems(tx: Prisma.TransactionClient, items: StockItem[]) {
  for (const item of items) {
    if (item.color || item.size) {
      const variant = await tx.productVariant.findFirst({
        where: { productId: item.productId, color: item.color || null, size: item.size || null },
      });
      if (variant) {
        const res = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (res.count === 0) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          throw new InsufficientStockError(product?.name ?? "produto");
        }
      }
    }

    const res = await tx.product.updateMany({
      where: { id: item.productId, stock: { gte: item.quantity } },
      data: { stock: { decrement: item.quantity } },
    });
    if (res.count === 0) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      throw new InsufficientStockError(product?.name ?? "produto");
    }
  }
}

/** Devolve ao estoque os itens de um pedido cancelado. */
export async function restoreStockForItems(items: StockItem[], client: PrismaClient | Prisma.TransactionClient = prisma) {
  for (const item of items) {
    if (item.color || item.size) {
      const variant = await client.productVariant.findFirst({
        where: { productId: item.productId, color: item.color || null, size: item.size || null },
      });
      if (variant) {
        await client.productVariant.update({ where: { id: variant.id }, data: { stock: { increment: item.quantity } } });
      }
    }
    await client.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
  }
}
