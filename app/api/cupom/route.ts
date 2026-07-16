import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCoupon } from "@/lib/coupons";
import { formatCurrency } from "@/lib/utils";

export { WELCOME_COUPON_CODE, WELCOME_COUPON_DISCOUNT } from "@/lib/coupons";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.toUpperCase().trim();
  const subtotalParam = searchParams.get("subtotal");
  const subtotal = subtotalParam !== null ? parseFloat(subtotalParam) : null;

  if (!code) return NextResponse.json({ error: "Código obrigatório" }, { status: 400 });

  const session = await getServerSession(authOptions);
  const result = await resolveCoupon(code, session?.user.id ?? null);

  if (!result.valid) {
    return NextResponse.json({ valid: false, error: result.error });
  }

  if (result.minPurchase && subtotal !== null && subtotal < result.minPurchase) {
    return NextResponse.json({
      valid: false,
      error: `Este cupom exige compra mínima de ${formatCurrency(result.minPurchase)}`,
    });
  }

  return NextResponse.json({
    valid: true,
    type: result.type,
    vendorId: result.vendorId,
    resellerId: result.resellerId,
    discountType: result.discountType,
    discountValue: result.discountValue,
    freeShipping: result.freeShipping,
    minPurchase: result.minPurchase,
    ownerName: result.ownerName,
  });
}
