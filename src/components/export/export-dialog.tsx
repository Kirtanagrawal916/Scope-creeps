/**
 * export-dialog.tsx — Comprehensive Modal Dialog for Export Reports.
 */

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Download,
  Loader2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { executeExport } from "@/lib/export-engine";
import { getBulkExport } from "@/lib/exports.server";
import type { ExportFormat, ExportScope, ExportFilterOptions } from "@/lib/export-engine/types";

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScope?: ExportScope;
  defaultTargetId?: string;
  defaultTitle?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  defaultScope = "dashboard",
  defaultTargetId,
  defaultTitle,
}: ExportDialogProps) {
  const [scope, setScope] = useState<ExportScope>(defaultScope);
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Filters
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [riskLow, setRiskLow] = useState(true);
  const [riskMedium, setRiskMedium] = useState(true);
  const [riskHigh, setRiskHigh] = useState(true);
  const [priorityLow, setPriorityLow] = useState(true);
  const [priorityMed, setPriorityMed] = useState(true);
  const [priorityHigh, setPriorityHigh] = useState(true);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setProgress(10);

      const selectedRiskLevels: ("low" | "medium" | "high")[] = [];
      if (riskLow) selectedRiskLevels.push("low");
      if (riskMedium) selectedRiskLevels.push("medium");
      if (riskHigh) selectedRiskLevels.push("high");

      const selectedPriorityLevels: ("low" | "medium" | "high")[] = [];
      if (priorityLow) selectedPriorityLevels.push("low");
      if (priorityMed) selectedPriorityLevels.push("medium");
      if (priorityHigh) selectedPriorityLevels.push("high");

      const filterOptions: ExportFilterOptions = {
        riskLevels: selectedRiskLevels,
        priorityLevels: selectedPriorityLevels,
        dateRange: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        },
      };

      setProgress(30);

      const payload = await getBulkExport({
        data: {
          scope,
          targetId: defaultTargetId,
          filters: filterOptions,
        },
      });

      setProgress(60);

      const result = await executeExport(payload, format, (p) => setProgress(60 + p * 0.4));

      setProgress(100);
      toast.success(`Report exported successfully: ${result.filename}`);
      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        onOpenChange(false);
      }, 600);
    } catch (err) {
      setIsExporting(false);
      setProgress(0);
      const error = err as Error;
      toast.error(error.message || "Failed to generate report export.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl sm:max-w-2xl bg-card text-card-foreground border-border rounded-xl shadow-2xl overflow-hidden p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-semibold shadow-inner">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {defaultTitle || "Export Professional Reports"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Generate production-ready PDF, Excel, CSV, or formatted reports.
              </DialogDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/5 text-xs px-2.5 py-1"
          >
            <Sparkles className="mr-1 h-3 w-3" /> ScopeGuard Engine
          </Badge>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Format Selector */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
              1. Select Export Format
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "pdf"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-6 w-6 mb-1.5" />
                <span className="text-xs font-semibold">PDF Document</span>
                <span className="text-[10px] opacity-75">Print Ready & Styled</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "excel"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileSpreadsheet className="h-6 w-6 mb-1.5 text-emerald-500" />
                <span className="text-xs font-semibold">Excel (.xlsx)</span>
                <span className="text-[10px] opacity-75">Multi-sheet Workbook</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("csv")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "csv"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCode className="h-6 w-6 mb-1.5 text-blue-500" />
                <span className="text-xs font-semibold">CSV File</span>
                <span className="text-[10px] opacity-75">UTF-8 Escaped</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("json")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "json"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileCode className="h-6 w-6 mb-1.5 text-amber-500" />
                <span className="text-xs font-semibold">JSON Data</span>
                <span className="text-[10px] opacity-75">Raw Payload</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("docx")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "docx"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="h-6 w-6 mb-1.5 text-purple-500" />
                <span className="text-xs font-semibold">Word (.docx)</span>
                <span className="text-[10px] opacity-75">Formatted Doc</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("zip")}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border transition-all text-center ${
                  format === "zip"
                    ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                    : "border-border/60 hover:border-border bg-accent/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileArchive className="h-6 w-6 mb-1.5 text-rose-500" />
                <span className="text-xs font-semibold">ZIP Bundle</span>
                <span className="text-[10px] opacity-75">All Formats Archive</span>
              </button>
            </div>
          </div>

          {/* Scope Selector */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 block">
              2. Report Scope Target
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "dashboard", label: "Dashboard Summary" },
                { id: "analyses_bulk", label: "Scope Analyses" },
                { id: "projects_bulk", label: "Projects Master" },
                { id: "analytics", label: "Analytics KPIs" },
                { id: "workspace", label: "Complete Workspace" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScope(item.id as ExportScope)}
                  className={`px-3 py-2 text-xs rounded-lg border font-medium transition-all text-left flex items-center justify-between ${
                    scope === item.id
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border/60 bg-accent/20 hover:bg-accent/60 text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {scope === item.id && <CheckCircle2 className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Filters & Options */}
          <div className="bg-accent/30 rounded-xl p-4 border border-border/50 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Filter className="h-4 w-4 text-primary" />
              <span>Filters & Date Restrictions</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">Start Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-8 text-xs h-8 bg-background"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground mb-1 block">End Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-8 text-xs h-8 bg-background"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-[11px] text-muted-foreground mb-2 block">
                Risk Level Filter
              </Label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={riskLow} onCheckedChange={(c) => setRiskLow(!!c)} />
                  <span className="text-emerald-500 font-medium">Low Risk</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={riskMedium} onCheckedChange={(c) => setRiskMedium(!!c)} />
                  <span className="text-amber-500 font-medium">Medium Risk</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <Checkbox checked={riskHigh} onCheckedChange={(c) => setRiskHigh(!!c)} />
                  <span className="text-rose-500 font-medium">High Risk</span>
                </label>
              </div>
            </div>
          </div>

          {/* Export Progress Indicator */}
          {isExporting && (
            <div className="space-y-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
              <div className="flex justify-between text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating {format.toUpperCase()}{" "}
                  report...
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5 bg-primary/20" />
            </div>
          )}
        </div>

        <DialogFooter className="bg-accent/40 px-6 py-3 border-t border-border/40 flex items-center justify-between sm:justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 text-primary" />
            <span>IDOR-protected. Data is filtered to your user account.</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={() => onOpenChange(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isExporting}
              onClick={handleExport}
              className="text-xs h-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 shadow-sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Processing
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
