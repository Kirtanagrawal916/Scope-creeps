import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote:
      "ScopeGuard saved us from eating 30+ hours of extra feature requests on our last SaaS build. Quantifying cost in ₹ before replying changed everything.",
    author: "Rohan Verma",
    role: "Lead Fullstack Consultant",
    company: "Verma Tech Labs",
    avatar: "RV",
  },
  {
    quote:
      "Client change requests used to stall our sprints for days. Now we paste the email into ScopeGuard, get the cost impact in seconds, and reply professionally.",
    author: "Ananya Sharma",
    role: "Agency Co-Founder",
    company: "PixelCraft Studio",
    avatar: "AS",
  },
  {
    quote:
      "The contract-aware AI makes it impossible for clients to slide in 'quick favors' without a proper change estimate. Absolute game changer for freelancers.",
    author: "Karan Patel",
    role: "Senior React Engineer",
    company: "Freelance Developer",
    avatar: "KP",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Loved by Consultants & Agencies
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          What Developers Say About ScopeGuard.
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          See how teams use ScopeGuard to protect timelines and get paid for extra work.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((t, index) => (
          <motion.div
            key={t.author}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <Quote className="h-6 w-6 text-primary/30 mb-2" />
              <p className="text-sm leading-relaxed text-foreground/90 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-border/60 pt-4">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {t.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-sm font-semibold leading-tight">{t.author}</h4>
                <p className="text-xs text-muted-foreground">
                  {t.role} · {t.company}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
