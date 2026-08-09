import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What is scope creep and why does it happen?",
    a: "Scope creep refers to unapproved, un-budgeted feature requests or modifications introduced into a project after the initial contract/statement of work is signed. It usually happens when clients ask for 'quick additions' without accounting for development hours.",
  },
  {
    q: "How does ScopeGuard detect scope creep in client emails?",
    a: "ScopeGuard compares incoming client email text or messages against your project's defined milestone scope and contract rules. Its AI engine identifies newly introduced requirements, assigns a risk score, and calculates cost impact.",
  },
  {
    q: "How is the project cost impact calculated?",
    a: "Cost impact is computed using your project's default hourly rate (in ₹) multiplied by estimated developer hours needed for the extra work, plus risk and timeline multipliers.",
  },
  {
    q: "Can I export scope analysis reports to PDF or Excel?",
    a: "Yes! ScopeGuard features a full built-in Export Engine that lets you export analysis reports, project change logs, and notifications to PDF, CSV, Excel (.xlsx), and JSON.",
  },
  {
    q: "Can multiple team members use ScopeGuard?",
    a: "Yes. Workspaces support team collaboration, allowing developers, project managers, and account leads to view and manage scope change requests together.",
  },
  {
    q: "Is ScopeGuard compatible with light and dark mode?",
    a: "Absolutely. ScopeGuard features a full theme engine supporting both light paper and dark charcoal modes across all views, charts, and dialogues.",
  },
];

export function FaqAccordion() {
  return (
    <section id="faq" className="mx-auto max-w-4xl px-5 py-20 sm:px-8 md:py-28">
      <div className="text-center max-w-2xl mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Frequently Asked Questions
        </p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          Everything You Need to Know.
        </h2>
        <p className="mt-3 text-base text-muted-foreground">
          Got questions about ScopeGuard? Here are clear answers to help you get started.
        </p>
      </div>

      <div className="mt-12">
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="rounded-xl border border-border bg-card px-5 shadow-sm"
            >
              <AccordionTrigger className="text-left text-base font-semibold py-4 hover:no-underline hover:text-primary">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
