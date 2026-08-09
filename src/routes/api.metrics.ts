import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const getPrometheusMetrics = createServerFn({ method: "GET" }).handler(async () => {
  const { metricsCollector } = await import("@/lib/metrics");
  return metricsCollector.getPrometheusFormat();
});

export const Route = createFileRoute("/api/metrics")({
  loader: async () => {
    return await getPrometheusMetrics();
  },
  component: () => null,
});
