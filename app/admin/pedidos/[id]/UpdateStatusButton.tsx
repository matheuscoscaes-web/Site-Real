"use client";

import { useRouter } from "next/navigation";
import { cn, ORDER_STATUS_COLORS } from "@/lib/utils";

export function UpdateStatusButton({
  orderId,
  status,
  currentStatus,
  label,
}: {
  orderId: string;
  status: string;
  currentStatus: string;
  label: string;
}) {
  const router = useRouter();
  const isActive = status === currentStatus;

  async function handleUpdate() {
    if (isActive) return;
    await fetch(`/api/pedidos/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  return (
    <button
      onClick={handleUpdate}
      disabled={isActive}
      className={cn(
        "px-4 py-2 rounded-xl text-xs font-semibold transition-all border-2",
        isActive
          ? `${ORDER_STATUS_COLORS[status]} border-transparent cursor-default`
          : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
      )}
    >
      {label}
    </button>
  );
}
