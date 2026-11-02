"use client";

import { useState } from "react";

const QUESTIONS = [
  { q: "Does it show real MLS listings?", a: "Not yet. Sample listings show for now; your MLS feed plugs in once you have an IDX agreement." },
  { q: "Can I use my own domain?", a: "That’s coming. For now your site lives at imakepage.com/s/your-name." },
  { q: "Does it send email and texts?", a: "Replies are saved to each lead today. Delivery switches on when you connect an email provider." },
  { q: "Will it work on my phone?", a: "Every screen is built for one thumb, so you can reply between showings." },
];

export function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section aria-labelledby="faq-heading" className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-24 sm:px-10 lg:grid-cols-12 lg:pb-32">
      <div data-enter className="lg:col-span-5">
        <h2 id="faq-heading" className="text-head font-extrabold tracking-[-0.04em] text-ink">Fair questions</h2>
        <ul className="mt-8 flex flex-col gap-[18px]">
          {QUESTIONS.map((item, i) => (
            <li key={item.q}>
              <button
                type="button"
                aria-expanded={open === i}
                aria-controls={`faq-answer-${i} faq-panel`}
                onClick={() => setOpen(i)}
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                className={`flex items-start gap-3 text-left text-body ${open === i ? "text-ink" : "text-muted"}`}
              >
                <span aria-hidden="true" className={`mt-[0.55em] size-2 shrink-0 rounded-full ${open === i ? "bg-accent" : "bg-rule"}`} />
                {item.q}
              </button>
              <p id={`faq-answer-${i}`} hidden={open !== i} className="mt-2 max-w-[60ch] pl-5 text-body text-ink lg:hidden">
                {item.a}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="hidden lg:col-span-6 lg:col-start-7 lg:block">
        {/* The live region stays mounted; only the inner text is re-keyed for the fade. */}
        <p id="faq-panel" aria-live="polite" className="sticky top-[120px] max-w-[34ch] rounded-2xl bg-surface p-8 text-lead text-ink">
          <span key={open} className="motion-safe:animate-[fade_150ms_ease-out]">{QUESTIONS[open].a}</span>
        </p>
      </div>
    </section>
  );
}
