export const QUESTIONS = [
  { q: "Will it bring me leads?", a: "No. It gives buyers who find your site a good way to reach you, and keeps those inquiries in one place. Bringing people to your site is still up to you." },
  { q: "Does it show real MLS listings?", a: "Not yet. Sample listings show for now. An MLS feed needs an IDX agreement and hasn’t been connected." },
  { q: "Does it send email and texts?", a: "Not yet. Replies are saved on each lead and kept in an in-app outbox, so nothing reaches the buyer by email or text." },
  { q: "Can I use my own domain?", a: "Not yet. Each site has its own address in the form /s/your-name." },
  { q: "What does it cost?", a: "Pricing isn’t set and billing isn’t built, so signing up doesn’t ask for a card." },
  { q: "Will it work on my phone?", a: "Yes. Your site and your back office are both laid out for phones, so you can check inquiries between showings." },
  { q: "Who is behind My Golden Brick?", a: "My Golden Brick is owned by Mike Bjork." },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="grid grid-cols-1 gap-8 px-gutter py-24 lg:grid-cols-12 lg:gap-10 lg:py-40">
      <div className="self-start lg:sticky lg:top-24 lg:col-span-4">
        <h2 id="faq-heading" data-enter className="landing-head">Plain answers</h2>
        <p data-enter className="mt-4 max-w-[32ch] text-body text-muted">What it does today, and what it doesn’t do yet.</p>
      </div>
      <div className="flex flex-col gap-2 lg:col-span-7 lg:col-start-6">
        {QUESTIONS.map((item, i) => (
          <details key={item.q} name="faq" open={i === 0} className="faq-tile rounded-lg bg-surface transition-colors">
            <summary className="flex min-h-[4.5rem] items-center justify-between gap-6 px-6 py-4 text-body font-semibold">
              {item.q}
              <span aria-hidden="true" className="faq-sign" />
            </summary>
            <p className="max-w-[56ch] px-6 pb-6 text-body">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
