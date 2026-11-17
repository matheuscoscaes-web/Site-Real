import { captureRequestError } from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { startOrderExpirySweep } = await import("./lib/orderExpiry");
    startOrderExpirySweep();
    const { startTrackingSweep } = await import("./lib/rastreio");
    startTrackingSweep();
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = captureRequestError;
