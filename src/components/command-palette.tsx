import { GlobalSearchModal } from "./global-search";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function CommandPalette({ open, onOpenChange, initialQuery }: CommandPaletteProps) {
  return <GlobalSearchModal open={open} onOpenChange={onOpenChange} initialQuery={initialQuery} />;
}
