import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'What counts as an AI action?',
    a: 'Any voice command, AI insight request, food lookup, or semantic search counts as one AI action. Free users get a limited number per month. Pro users get unlimited.',
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Your data is stored securely in your account. We never sell it to advertisers or share it with third parties. BeMe earns from subscriptions — not from monetizing your habits.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. BeMe is a full web app. It works in any browser on desktop, laptop, tablet, or phone. No downloads, no updates, no app store.',
  },
  {
    q: 'Can I use BeMe without the AI features?',
    a: 'Absolutely. All the core tracking — money, body, energy, schedule, goals, and groups — works entirely manually. AI features are optional add-ons.',
  },
  {
    q: 'What does Pro include?',
    a: 'Pro gives unlimited AI including voice input, AI insights, food lookup, and semantic search. Plus daily AI summaries and priority support.',
  },
  {
    q: 'Can I share data with my partner or household?',
    a: 'Yes. The Groups feature lets you create shared spaces. Invite members and collaborate on shared budgets, goals, and planning.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime — no lock-in. You keep Pro features until the end of your billing period, then you move to the Free plan.',
  },
];

interface FAQItemProps {
  faq: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ faq, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-border">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg py-5 text-left transition-colors hover:bg-muted/50"
      >
        <span className="pr-6 text-sm font-medium text-foreground">
          {faq.q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="faq"
      className="py-24 lg:py-32 bg-muted"
    >
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
              FAQ
            </p>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
              Common questions.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              If you have a question not answered here, reach out — we read every message.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {faqs.map((faq, i) => (
              <FAQItem
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
