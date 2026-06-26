"use client";

import { initMercadoPago, Payment } from "@mercadopago/sdk-react";

initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: "pt-BR" });

interface Props {
  amount: number;
  onSubmit: (formData: Record<string, unknown>) => Promise<void>;
  onError?: (error: unknown) => void;
}

export function MercadoPagoBrick({ amount, onSubmit, onError }: Props) {
  return (
    <Payment
      initialization={{ amount }}
      customization={{
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          ticket: "all",
          bankTransfer: "all",
          maxInstallments: 12,
        },
        visual: {
          style: {
            customVariables: {
              baseColor: "#9b2255",
              baseColorFirstVariant: "#7a1a42",
              baseColorSecondVariant: "#c23070",
              errorColor: "#f23d4f",
              successColor: "#00a650",
            },
          },
        },
      }}
      onSubmit={async ({ formData }) => {
        await onSubmit(formData as unknown as Record<string, unknown>);
      }}
      onError={onError}
    />
  );
}
