import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
} | null>(null);

function getSavedTheme(): Theme {
  const saved = window.localStorage.getItem("scopeguard-theme");
  if (saved === "dark" || saved === "light") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTheme(getSavedTheme());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");
    root.style.colorScheme = theme;
    window.localStorage.setItem("scopeguard-theme", theme);
  }, [hydrated, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}

export function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "theme-toggle flex items-center gap-1 rounded-full border border-border bg-card/70 p-1 shadow-sm backdrop-blur-xl",
        className,
      )}
      aria-label="Theme"
    >
      <button
        type="button"
        aria-label="Use light mode"
        onClick={() => setTheme("light")}
        className={cn(
          "group flex items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
          compact ? "h-8 w-8" : "h-8 gap-1.5 px-2.5",
          !isDark && "bg-primary text-primary-foreground shadow-sm hover:text-primary-foreground",
        )}
      >
        <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
        {!compact && <span className="hidden text-[12px] font-medium sm:inline">Light</span>}
      </button>
      <button
        type="button"
        aria-label="Use dark mode"
        onClick={() => setTheme("dark")}
        className={cn(
          "group flex items-center justify-center rounded-full text-muted-foreground transition-all duration-300 hover:text-foreground",
          compact ? "h-8 w-8" : "h-8 gap-1.5 px-2.5",
          isDark && "bg-primary text-primary-foreground shadow-sm hover:text-primary-foreground",
        )}
      >
        <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12" />
        {!compact && <span className="hidden text-[12px] font-medium sm:inline">Dark</span>}
      </button>
    </div>
  );
}
