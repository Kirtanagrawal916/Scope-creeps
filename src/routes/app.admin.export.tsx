import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { recordsToCsv, downloadFile } from "@/lib/export-engine";
import { listExportableDatasets, getAdminExportData } from "@/lib/admin-export.server";
import type { AdminExportDataset, AdminExportTable } from "@/lib/admin-export.server";

export const Route = createFileRoute("/app/admin/export")({
  loader: async () => {
    const datasets = await listExportableDatasets();
    return { datasets };
  },
  component: ExportUsagePage,
  head: () => ({ meta: [{ title: "Export Usage — Admin — ScopeGuard" }] }),
});

function ExportUsagePage() {
  const { datasets } = Route.useLoaderData();
  const [downloadingDataset, setDownloadingDataset] = useState<AdminExportDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(dataset: AdminExportDataset) {
    setError(null);
    setDownloadingDataset(dataset);
    try {
      const table: AdminExportTable = await getAdminExportData({ data: { dataset } });
      const csv = recordsToCsv(table.headers, table.records);
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadFile(csv, `ScopeGuard_Admin_${dataset}_${dateStr}.csv`, "text/csv;charset=utf-8;");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate export.");
    } finally {
      setDownloadingDataset(null);
    }
  }

  return (
    <AppShell title="Export Usage" subtitle="Download admin data as CSV.">
      {error && (
        <div className="mb-4 rounded-lg border border-[color:var(--destructive)]/30 bg-[color-mix(in_oklab,var(--destructive)_8%,transparent)] px-4 py-2.5 text-[13px] text-[color:var(--destructive)]">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {datasets.map((d) => (
          <div key={d.value} className="panel flex flex-col gap-3 p-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-muted-foreground">
              <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[14px] font-medium text-foreground">{d.label}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">CSV export</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1 gap-1.5"
              onClick={() => handleDownload(d.value)}
              disabled={downloadingDataset === d.value}
            >
              <Download className="h-3.5 w-3.5" />
              {downloadingDataset === d.value ? "Preparing…" : "Download CSV"}
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-2xl text-[12px] text-muted-foreground">
        PDF export isn&apos;t available for these admin datasets yet — the project&apos;s existing
        PDF generator is built specifically for project/analysis reports, and extending it here
        would mean duplicating that logic rather than reusing it. CSV covers every dataset above.
      </p>
    </AppShell>
  );
}
