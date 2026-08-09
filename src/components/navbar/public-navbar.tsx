import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function PublicNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-md shadow-sm"
          : "border-b border-sidebar-border bg-sidebar text-sidebar-foreground"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <Logo
            className={isScrolled ? "[&_span]:text-foreground" : "[&_span]:text-sidebar-foreground"}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 font-mono text-[11px] uppercase tracking-[0.18em] md:flex">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`transition-colors hover:text-primary ${
                isScrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground"
              }`}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle compact />
          <Button
            variant="ghost"
            size="sm"
            className={
              isScrolled
                ? "text-foreground hover:bg-muted"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }
            asChild
          >
            <Link to="/login">Log in</Link>
          </Button>
          <Button
            size="sm"
            className="group gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            asChild
          >
            <Link to="/register">
              Start Free
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </div>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle compact />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-2 rounded-md transition-colors ${
              isScrolled
                ? "text-foreground hover:bg-muted"
                : "text-sidebar-foreground hover:bg-sidebar-accent"
            }`}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-[65px] bottom-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border p-6 flex flex-col justify-between md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-5 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border/40"
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3 pb-8">
            <Button variant="outline" size="lg" className="w-full justify-center" asChild>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
            </Button>
            <Button size="lg" className="w-full justify-center gap-2" asChild>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                Start Free Workspace <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
