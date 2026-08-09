import { createFileRoute } from "@tanstack/react-router";
import { PublicNavbar } from "@/components/navbar/public-navbar";
import { ParticleBackdrop } from "@/components/particle-backdrop";
import { Hero } from "@/components/landing/hero";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import { CtaBanner } from "@/components/landing/cta-banner";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/")({
  component: Landing,
  head: () => ({ meta: [{ title: "ScopeGuard — Protect the Work You Scoped" }] }),
});

function Landing() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Canvas Particle Backdrop */}
      <ParticleBackdrop />

      {/* Public Sticky Navbar */}
      <PublicNavbar />

      <main className="relative z-10">
        {/* Hero Section with Product Preview */}
        <Hero />

        {/* Feature Capabilities Grid */}
        <FeatureGrid />

        {/* How It Works Workflow */}
        <HowItWorks />

        {/* Testimonials */}
        <Testimonials />

        {/* Pricing Plans in INR (₹) */}
        <PricingPlans />

        {/* FAQ Accordion */}
        <FaqAccordion />

        {/* Call to Action Banner */}
        <CtaBanner />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-sidebar px-5 py-8 text-sidebar-foreground sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo className="[&_span]:text-sidebar-foreground" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/50">
            ScopeGuard © {new Date().getFullYear()} — Protect the work you scoped. All rights
            reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
