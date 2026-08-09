import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Freelance",
    price: "₹499",
    period: "per month",
    description: "Ideal for solo developers & freelancers managing client deliverables.",
    features: [
      "Up to 3 Active Projects",
      "AI Scope Creep Analysis",
      "Cost Impact Calculation (₹)",
      "Standard PDF & CSV Exports",
      "Email Analysis History",
      "Community Support",
    ],
    cta: "Start Freelancer Free",
    popular: false,
  },
  {
    name: "Agency Pro",
    price: "₹1,499",
    period: "per month",
    description: "Best for growing agencies, dev teams, and consultancy practices.",
    features: [
      "Unlimited Projects & Workspaces",
      "Advanced AI Scope Analysis",
      "Automated Diplomatic Draft Replies",
      "Full Export Suite (PDF, Excel, JSON)",
      "Global Search & Filter Engine",
      "Priority Email & Slack Support",
      "Custom Hourly Rate Calculations",
    ],
    cta: "Start 14-Day Pro Trial",
    popular: true,
  },
  {
    name: "Studio Enterprise",
    price: "₹3,999",
    period: "per month",
    description: "Designed for software houses & enterprise dev agencies.",
    features: [
      "Everything in Agency Pro",
      "Custom SLA & Dedicated Support",
      "Team Role Permissions & Auditing",
      "Custom Contract Rules Engine",
      "Single Sign-On (Google + GitHub)",
      "Dedicated Account Manager",
    ],
    cta: "Contact Enterprise Team",
    popular: false,
  },
];

export function PricingPlans() {
  return (
    <section id="pricing" className="border-t border-border bg-muted/20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            Transparent Pricing
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            Simple Plans in Indian Rupees (₹).
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Choose the workspace plan that fits your software business. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`relative rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between transition-all ${
                plan.popular
                  ? "border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground shadow-sm">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold tracking-tight">{plan.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground min-h-[36px]">
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1 border-b border-border/60 pb-6">
                  <span className="font-display text-4xl font-extrabold tracking-tight text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <Button
                  variant={plan.popular ? "default" : "outline"}
                  size="lg"
                  className="w-full justify-center"
                  asChild
                >
                  <Link to="/register">{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
