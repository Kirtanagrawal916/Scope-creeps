/**
 * export-button.tsx — Reusable Action Trigger for Export Dialog.
 */

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExportDialog } from "./export-dialog";
import type { ExportScope } from "@/lib/export-engine/types";

export interface ExportButtonProps extends ButtonProps {
  defaultScope?: ExportScope;
  defaultTargetId?: string;
  label?: string;
}

export function ExportButton({
  defaultScope = "dashboard",
  defaultTargetId,
  label = "Export Report",
  variant = "outline",
  size = "sm",
  className,
  ...props
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
        {...props}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        <span>{label}</span>
      </Button>

      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        defaultScope={defaultScope}
        defaultTargetId={defaultTargetId}
      />
    </>
  );
}
