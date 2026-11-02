"use client";

import { forwardRef } from "react";
import type { FormEvent, ReactNode } from "react";
import { slugify } from "@/lib/builder";
import { firstName } from "@/lib/demo";

/** A fictional home, used only on this page. */
export const SAMPLE_HOME = {
  street: "2144 Pacific Lane",
  area: "Dundee",
  price: "$485,000",
  facts: "4 beds, 3 baths",
  photo: "/prototype/home-dusk.jpg",
};

export type Lead = { id: string; name: string; message: string; when: string; arrived: boolean; contacted: boolean };

/** Fictional people already in the sample inbox, so the new one has something to arrive above. */
export const STARTING_LEADS: Lead[] = [
  { id: "chris", name: "Chris Nguyen", message: "What could my house sell for?", when: "1d", arrived: false, contacted: false },
  { id: "taylor", name: "Taylor Brooks", message: "Is the basement finished at Linden Road?", when: "2d", arrived: false, contacted: false },
  { id: "avery", name: "Avery Johnson", message: "Tour request for this Saturday, if it’s open.", when: "3d", arrived: false, contacted: true },
  { id: "drew", name: "Drew Patel", message: "Are you taking new buyers this spring?", when: "5d", arrived: false, contacted: true },
  { id: "sam", name: "Sam Whitfield", message: "Thanks for the showing. We’d like to talk numbers.", when: "1w", arrived: false, contacted: true },
];

type SiteProps = {
  display: string;
  named: boolean;
  buyer: string;
  message: string;
  busy: boolean;
  sent: number;
  onBuyer: (value: string) => void;
  onMessage: (value: string) => void;
  onSend: (event: FormEvent<HTMLFormElement>) => void;
  sendRef: React.Ref<HTMLButtonElement>;
  onPhoto?: () => void;
  style?: React.CSSProperties;
};

/**
 * The agent's site, on the listing page where buyers actually ask. It uses the product's own
 * white ground, Inter and gold button, because this is what an agent really gets.
 */
export const SitePanel = forwardRef<HTMLDivElement, SiteProps>(function SitePanel(
  { display, named, buyer, message, busy, sent, onBuyer, onMessage, onSend, sendRef, onPhoto, style },
  ref,
) {
  const slug = named ? slugify(display) : "your-name";
  return (
    <div ref={ref} data-panel="site" className="panel site-panel" style={style}>
      <div className="panel-tag">
        <span className="panel-tag-strong">Sample site</span>
        <span className="panel-tag-address">/s/{slug}</span>
      </div>
      <div className="site-bar">
        <p className="site-name">{display}</p>
        <p className="site-nav" aria-hidden="true"><span>Homes for sale</span><span>About</span><span>Contact</span></p>
      </div>
      <p className="site-headline">Homes for sale with {display}</p>
      <div className="site-body">
        <div className="site-home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={SAMPLE_HOME.photo} alt="A fictional sample home at dusk, its windows lit" className="site-photo" width={1200} height={800} loading="lazy" decoding="async" onLoad={onPhoto} />
        </div>
        <div className="site-side">
        <div className="site-facts">
          <p className="site-price">{SAMPLE_HOME.price}</p>
          <p>{SAMPLE_HOME.street}, {SAMPLE_HOME.area}</p>
          <p>{SAMPLE_HOME.facts}. Sample listing, not a real home.</p>
        </div>
        <form className="site-form" onSubmit={onSend} aria-label="Ask about this home">
          <h3 className="site-form-title">Ask {firstName(display) || "the agent"} about this home</h3>
          <label className="field">
            <span>Your name</span>
            <input value={buyer} onChange={(e) => onBuyer(e.target.value)} autoComplete="off" maxLength={60} />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea value={message} onChange={(e) => onMessage(e.target.value)} rows={3} maxLength={240} />
          </label>
          <button ref={sendRef} type="submit" className="send" disabled={busy}>
            {sent === 0 ? "Send sample inquiry" : "Send another sample"}
          </button>
          <p className="site-note">Demo. Nothing is saved or sent.</p>
        </form>
        </div>
      </div>
    </div>
  );
});

type InboxProps = {
  display: string;
  leads: Lead[];
  onToggle: (id: string) => void;
  slotRef: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  children?: ReactNode;
};

/** The agent's workspace, in the back office's own look: a plain list with who is waiting on top. */
export const InboxPanel = forwardRef<HTMLDivElement, InboxProps>(function InboxPanel({ display, leads, onToggle, slotRef, style }, ref) {
  const first = firstName(display);
  const waiting = leads.filter((l) => !l.contacted).length;
  return (
    <div ref={ref} data-panel="inbox" className="panel inbox-panel" style={style}>
      <div className="panel-tag">
        <span className="panel-tag-strong">Sample workspace</span>
        <span className="panel-tag-address">Buyers are fictional</span>
      </div>
      <p className="inbox-nav" aria-hidden="true"><span>Today</span><span className="is-on">Leads</span><span>Pipeline</span><span>Website</span></p>
      <div className="inbox-head">
        <h3 className="inbox-title">{first ? `${first}’s leads` : "Your leads"}</h3>
        <p className="inbox-count">{waiting} waiting on you</p>
      </div>
      <ul className="inbox-list">
        <li ref={slotRef} className="inbox-slot" aria-hidden="true" />
        {leads.map((lead) => (
          <li key={lead.id} className={`lead${lead.arrived ? " is-new" : ""}${lead.contacted ? " is-done" : ""}`}>
            <div className="lead-top">
              {lead.arrived ? <span aria-hidden="true" className="lead-brick" /> : <span aria-hidden="true" className="lead-dot" />}
              <span className="lead-name">{lead.name}</span>
              <span className="lead-when">{lead.when}</span>
            </div>
            <p className="lead-message">{lead.message}</p>
            {!lead.arrived && lead.contacted && <p className="lead-stage">Contacted</p>}
            {lead.arrived && (
              <div className="lead-foot">
                <span className="lead-tag">Sample inquiry, {SAMPLE_HOME.street}</span>
                <button type="button" className="lead-action" onClick={() => onToggle(lead.id)}>
                  {lead.contacted ? "Move back to New" : "Mark as contacted"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
});
