"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { askLead, firstName } from "@/lib/demo";
import { slugify } from "@/lib/builder";
import type { Engine, ScreenRect } from "./engine";
import { InboxPanel, SAMPLE_HOME, SitePanel, STARTING_LEADS, type Lead } from "./panels";
import { paintPanel } from "./mosaic";
import { demoRest, timeline, type Marks } from "./timeline";
import { smoothstep } from "./field";

type Mode = "loading" | "live" | "still" | "fallback";

const REDUCED = "(prefers-reduced-motion: reduce)";

/** The page as a document: the world behind it only ever reads where the page has scrolled to. */
export function MotionExperience({ fontFamily }: { fontFamily: string }) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<Mode>("loading");
  const [paused, setPaused] = useState(false);
  const [leads, setLeads] = useState<Lead[]>(STARTING_LEADS);
  const [sent, setSent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [buyer, setBuyer] = useState(() => askLead(0, SAMPLE_HOME.street).name);
  const [message, setMessage] = useState(() => askLead(0, SAMPLE_HOME.street).message);

  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const engine = useRef<Engine | null>(null);
  const nameSection = useRef<HTMLElement>(null);
  const demo = useRef<HTMLElement>(null);
  const closing = useRef<HTMLElement>(null);
  const siteWrap = useRef<HTMLDivElement>(null);
  const inboxWrap = useRef<HTMLDivElement>(null);
  const sitePanel = useRef<HTMLDivElement>(null);
  const inboxPanel = useRef<HTMLDivElement>(null);
  const sendButton = useRef<HTMLButtonElement>(null);
  const slot = useRef<HTMLLIElement>(null);
  const flyer = useRef<HTMLDivElement>(null);
  const marks = useRef<Marks | null>(null);
  const stacked = useRef(false);
  const solid = useRef({ site: false, inbox: false });
  const scrollTween = useRef(0);
  const modeRef = useRef<Mode>("loading");
  const leadCount = useRef(0);

  const display = name.trim() || "Your Name";
  const named = name.trim().length > 0;
  const motionOn = useCallback(() => modeRef.current === "live" && !window.matchMedia(REDUCED).matches, []);

  /** Glides the page to a position. Any touch, wheel or key takes the page straight back. */
  const glideTo = useCallback((y: number, ms = 1700) => {
    cancelAnimationFrame(scrollTween.current);
    if (!motionOn()) {
      window.scrollTo(0, y);
      return;
    }
    const from = window.scrollY;
    const start = performance.now();
    const stop = () => {
      cancelAnimationFrame(scrollTween.current);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      window.scrollTo(0, from + (y - from) * e);
      if (t < 1) scrollTween.current = requestAnimationFrame(tick);
      else stop();
    };
    scrollTween.current = requestAnimationFrame(tick);
  }, [motionOn]);

  const nameRest = useCallback(() => marks.current?.nameRest ?? nameSection.current?.offsetTop ?? 0, []);

  /* ---------- Measuring the page ---------- */
  const measure = useCallback(() => {
    const el = root.current;
    const form = el?.querySelector<HTMLElement>(".name-form");
    if (form) {
      const y = form.offsetTop;
      const phone = window.innerWidth < 600;
      const shift = phone ? 74 - y : window.innerHeight - y - form.offsetHeight - 34;
      form.style.setProperty("--form-shift", `${Math.round(shift)}px`);
    }
    const site = sitePanel.current;
    const inbox = inboxPanel.current;
    const demoEl = demo.current;
    const closeEl = closing.current;
    const nameEl = nameSection.current;
    const siteW = siteWrap.current;
    const inboxW = inboxWrap.current;
    if (!el || !site || !inbox || !demoEl || !closeEl || !nameEl || !siteW || !inboxW) return;
    const vh = window.innerHeight;
    const top = (node: HTMLElement) => node.getBoundingClientRect().top + window.scrollY;
    const isStacked = getComputedStyle(demoEl).getPropertyValue("--stacked").trim() === "1";
    stacked.current = isStacked;

    const nameTop = top(nameEl);
    const nameHeight = nameEl.offsetHeight;
    const closeTop = top(closeEl);
    let m: Marks;
    let rectA: ScreenRect;
    let rectB: ScreenRect;
    if (isStacked) {
      // Tall panels pin at their foot, so everything in them can still be scrolled to.
      const pinFor = (panel: HTMLElement) => Math.min(70, vh - panel.offsetHeight - 12);
      solid.current = { site: site.offsetHeight > vh - 82, inbox: inbox.offsetHeight > vh - 82 };
      const pinA = pinFor(site);
      const pinB = pinFor(inbox);
      site.style.setProperty("--pin", `${pinA}px`);
      inbox.style.setProperty("--pin", `${pinB}px`);
      const aStart = top(siteW) - pinA;
      const aEnd = top(siteW) + siteW.offsetHeight - site.offsetHeight - pinA;
      const bStart = top(inboxW) - pinB;
      const bEnd = top(inboxW) + inboxW.offsetHeight - inbox.offsetHeight - pinB;
      m = {
        nameTop,
        nameRest: nameTop + Math.max(0, nameHeight - vh) * 0.45,
        demoStart: aStart,
        demoEnd: bEnd,
        closeTop,
        siteIn: [aStart, aStart + (aEnd - aStart) * 0.32],
        siteOut: [aEnd - (aEnd - aStart) * 0.12, aEnd],
        inboxIn: [bStart, bStart + (bEnd - bStart) * 0.32],
        inboxOut: [bEnd - (bEnd - bStart) * 0.12, bEnd],
      };
      const rect = (panel: HTMLElement, pin: number): ScreenRect => {
        const r = panel.getBoundingClientRect();
        return { left: r.left, right: r.right, top: pin, bottom: pin + panel.offsetHeight };
      };
      rectA = rect(site, pinA);
      rectB = rect(inbox, pinB);
    } else {
      solid.current = { site: false, inbox: false };
      site.style.removeProperty("--pin");
      inbox.style.removeProperty("--pin");
      const start = top(demoEl);
      const end = start + demoEl.offsetHeight - vh;
      const span = end - start;
      m = {
        nameTop,
        nameRest: nameTop + Math.max(0, nameHeight - vh) * 0.45,
        demoStart: start,
        demoEnd: end,
        closeTop,
        siteIn: [start + span * 0.02, start + span * 0.3],
        inboxIn: [start + span * 0.3, start + span * 0.56],
        siteOut: [start + span * 0.91, end],
        inboxOut: [start + span * 0.91, end],
      };
      // Measured against the pinned stage, so these hold however far the page has scrolled.
      const stageOffset = (siteW.closest("[data-stage]") as HTMLElement).getBoundingClientRect().top;
      const rect = (panel: HTMLElement): ScreenRect => {
        const r = panel.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top - stageOffset, bottom: r.bottom - stageOffset };
      };
      rectA = rect(site);
      rectB = rect(inbox);
    }
    marks.current = m;
    engine.current?.setPlots(rectA, rectB);
  }, []);

  const repaint = useCallback(() => {
    const e = engine.current;
    if (!e) return;
    if (sitePanel.current) {
      const c = paintPanel(sitePanel.current);
      if (c) e.setMosaic(0, c);
    }
    if (inboxPanel.current) {
      const c = paintPanel(inboxPanel.current);
      if (c) e.setMosaic(1, c);
    }
  }, []);

  /* ---------- Starting the world, or settling for the still picture ---------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reduced = window.matchMedia(REDUCED).matches;
    let cancelled = false;
    const toFallback = () => {
      engine.current?.destroy();
      engine.current = null;
      modeRef.current = "fallback";
      setMode("fallback");
    };
    if (params.get("gl") === "off") {
      modeRef.current = "fallback";
      const id = window.setTimeout(() => setMode("fallback"), 0);
      return () => window.clearTimeout(id);
    }
    const startingMode: Mode = reduced ? "still" : "live";
    import("./engine")
      .then(async ({ createEngine }) => {
        if (cancelled || !canvas.current) return;
        const coarse = window.matchMedia("(pointer: coarse)").matches;
        const small = Math.min(window.innerWidth, window.innerHeight) < 600;
        const tier = params.get("tier") === "low" || params.get("tier") === "high"
          ? (params.get("tier") as "low" | "high")
          : coarse || small ? "low" : "high";
        const hold = params.get("intro");
        const intro = hold === "hold" ? "hold" : hold === "rest" || window.scrollY > 40 ? "rest" : "play";
        modeRef.current = startingMode;
        setMode(startingMode);
        try {
          const e = await createEngine({
            canvas: canvas.current,
            tier,
            still: reduced,
            intro,
            refuseSoftware: params.get("software") !== "try",
            cancelled: () => cancelled,
            onFirstFrame: () => root.current?.setAttribute("data-painted", "true"),
            onLost: toFallback,
          });
          if (cancelled) {
            e.destroy();
            return;
          }
          engine.current = e;
          (window as unknown as { __mgb?: unknown }).__mgb = e;
          e.setName(input.current?.value ?? "");
          void document.fonts.load(`800 40px ${fontFamily}`).then(() => {
            if (!cancelled) e.setNameFont(fontFamily);
          });
          requestAnimationFrame(() => {
            measure();
            repaint();
          });
        } catch (error) {
          if (cancelled) return;
          console.warn("Showing the still picture instead of the 3D scene:", error);
          toFallback();
        }
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn("Showing the still picture instead of the 3D scene:", error);
        toFallback();
      });
    return () => {
      cancelled = true;
      engine.current?.destroy();
      engine.current = null;
    };
  }, [fontFamily, measure, repaint]);

  /* ---------- Reading the page each frame ---------- */
  useEffect(() => {
    let raf = 0;
    const siteStyle = () => sitePanel.current?.style;
    const inboxStyle = () => inboxPanel.current?.style;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const m = marks.current;
      if (!m) return;
      const y = window.scrollY;
      const reading = timeline(y, m);
      const head = document.querySelector<HTMLElement>(".mgb-head");
      const headBottom = head?.offsetHeight ?? 64;
      const under = (panel: HTMLElement | null) => {
        if (!panel) return false;
        if (modeRef.current === "live" && !panel.hasAttribute("data-open")) return false;
        const r = panel.getBoundingClientRect();
        return r.top < headBottom - 4 && r.bottom > 0;
      };
      root.current?.setAttribute("data-head", under(sitePanel.current) || under(inboxPanel.current) ? "solid" : "clear");
      if (modeRef.current === "live") {
        const isSolid = solid.current;
        engine.current?.setReading({ ...reading, flipA: isSolid.site ? 0 : reading.flipA, flipB: isSolid.inbox ? 0 : reading.flipB });
        const a = isSolid.site ? 1 : smoothstep(0.84, 1, reading.flipA);
        const b = isSolid.inbox ? 1 : smoothstep(0.84, 1, reading.flipB);
        siteStyle()?.setProperty("--reveal", a.toFixed(3));
        inboxStyle()?.setProperty("--reveal", b.toFixed(3));
        sitePanel.current?.toggleAttribute("data-open", a > 0.5);
        inboxPanel.current?.toggleAttribute("data-open", b > 0.5);
      } else if (modeRef.current === "still") {
        // No journey: the world simply shows the part of the story the page has reached.
        const mid = y + window.innerHeight / 2;
        const q = mid < m.nameTop ? 0 : mid < m.demoStart ? 1 : mid < m.closeTop ? 2 : 3;
        engine.current?.setReading({ q, flipA: 0, flipB: 0, night: q === 3 ? 1 : 0, nameTint: q === 2 ? 0 : 1 });
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onResize = () => {
      engine.current?.resize();
      measure();
      repaint();
    };
    const id = window.setTimeout(measure, 0);
    window.addEventListener("resize", onResize);
    const observer = new ResizeObserver(() => measure());
    if (root.current) observer.observe(root.current);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
    };
  }, [measure, repaint, mode]);

  useEffect(() => {
    engine.current?.setName(name);
  }, [name]);

  // The picture on the bricks follows the page: redrawn once typing pauses or a lead lands.
  useEffect(() => {
    const id = window.setTimeout(() => {
      measure();
      repaint();
    }, 260);
    return () => window.clearTimeout(id);
  }, [name, leads, buyer, message, measure, repaint, mode]);

  useEffect(() => {
    engine.current?.setGold(sent);
  }, [sent]);

  useEffect(() => {
    if (mode === "live") engine.current?.setStill(paused);
  }, [paused, mode]);

  /* ---------- A keyboard or screen reader reaching a panel brings it into view ---------- */
  useEffect(() => {
    const onFocus = (e: FocusEvent) => {
      if (modeRef.current !== "live") return;
      const t = e.target as HTMLElement;
      const m = marks.current;
      if (!m) return;
      const panel = t.closest?.("[data-panel]");
      if (!panel) return;
      if (panel.hasAttribute("data-open")) return;
      const rest = panel.getAttribute("data-panel") === "site" ? m.siteIn[1] + 2 : demoRest(m);
      window.scrollTo(0, rest);
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, []);

  /* ---------- The story's own buttons ---------- */
  const onBuild = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    input.current?.blur();
    measure();
    glideTo(nameRest());
    setNote(named ? `Your name is set: ${name.trim()}.` : "Continuing with a placeholder name.");
  };

  const toSite = () => {
    measure();
    const m = marks.current;
    if (!m) return;
    glideTo(stacked.current ? m.siteIn[1] + 2 : demoRest(m), 2600);
  };

  const toggleContacted = (id: string) => {
    setLeads((all) => all.map((l) => (l.id === id ? { ...l, contacted: !l.contacted } : l)));
  };

  /** A sample inquiry: a gold brick leaves the buyer's page and lands in the agent's list. */
  const onSend = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const n = leadCount.current;
    const who = buyer.trim() || "Sample buyer";
    const said = message.trim() || `Is ${SAMPLE_HOME.street} still available?`;
    const lead: Lead = { id: `sample-${n}`, name: who, message: said, when: "Now", arrived: true, contacted: false };
    const finish = (x?: number, y?: number) => {
      leadCount.current = n + 1;
      setLeads((all) => [lead, ...all]);
      setSent(n + 1);
      setBusy(false);
      const next = askLead(n + 1, SAMPLE_HOME.street);
      setBuyer(next.name);
      setMessage(next.message);
      setNote(`Sample inquiry from ${who} is now at the top of the leads. Nothing was saved or sent.`);
      if (x !== undefined && y !== undefined) engine.current?.ripple(x, y, 1);
    };
    const el = flyer.current;
    const from = sendButton.current?.getBoundingClientRect();
    if (!motionOn() || paused || !el || !from) {
      finish();
      return;
    }
    setBusy(true);
    setNote(`Sending a sample inquiry from ${who}.`);
    const m = marks.current;
    const onPhone = stacked.current;
    if (onPhone && m) glideTo(demoRest(m), 1100);
    const duration = onPhone ? 1300 : 1150;
    const start = performance.now();
    const sx = from.left + from.width / 2;
    const sy = from.top + from.height / 2;
    el.style.display = "block";
    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / duration);
      const t = raw < 0.5 ? 2 * raw * raw : 1 - (-2 * raw + 2) ** 2 / 2;
      const to = slot.current?.getBoundingClientRect();
      const ex = to ? to.left + Math.min(40, to.width / 2) : sx;
      const ey = to ? to.top + 8 : sy;
      const x = sx + (ex - sx) * t;
      const arc = Math.sin(Math.PI * t);
      const y = sy + (ey - sy) * t - arc * Math.min(150, window.innerHeight * 0.18);
      const size = 0.7 + arc * 1.05;
      const spin = -28 + t * 360;
      el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${size}) rotateX(${-30 - arc * 8}deg) rotateY(${spin}deg)`;
      engine.current?.setFlight(x, y, Math.min(1, raw * 6) * (1 - raw * 0.2));
      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        el.style.display = "none";
        engine.current?.setFlight(0, 0, 0);
        finish(x, y);
      }
    };
    requestAnimationFrame(tick);
  };

  const editName = () => {
    window.scrollTo(0, 0);
    input.current?.focus();
  };

  const first = firstName(display);
  const signupHref = named ? `/signup?name=${encodeURIComponent(name.trim())}` : "/signup";

  return (
    <div ref={root} className="mgb" data-mode={mode} data-painted="false">
      <div className="mgb-backdrop" aria-hidden="true">
        <picture>
          <source media="(max-aspect-ratio: 1/1)" srcSet="/prototype/poster-start-tall.jpg" />
          <img className="poster poster-start" src="/prototype/poster-start.jpg" alt="" width={1600} height={1000} fetchPriority="high" decoding="async" />
        </picture>
        {mode === "fallback" && (
          <picture>
            <source media="(max-aspect-ratio: 1/1)" srcSet="/prototype/poster-rest-tall.jpg" />
            <img className="poster poster-rest" src="/prototype/poster-rest.jpg" alt="" width={1600} height={1000} decoding="async" />
          </picture>
        )}
        {mode !== "fallback" && <canvas ref={canvas} className="world" />}
      </div>

      <header className="mgb-head">
        <Link href="/" className="brand" aria-label="My Golden Brick home" translate="no">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/brick.png" alt="" width={64} height={64} />
          <span>My Golden Brick</span>
        </Link>
        <nav aria-label="Main" className="head-nav">
          {mode === "live" && (
            <button type="button" className="pause" aria-pressed={paused} aria-label={paused ? "Play motion" : "Pause motion"} title={paused ? "Play motion" : "Pause motion"} onClick={() => setPaused((p) => !p)}>
              <span aria-hidden="true" className={paused ? "icon-play" : "icon-pause"} />
            </button>
          )}
          <a href="#demo" className="head-link head-extra">How it works</a>
          <Link href="/s/jordan-avery" className="head-link head-extra">See a sample site</Link>
          <Link href="/login" className="head-link">Sign in</Link>
          <Link href={signupHref} className="head-cta">Make my site</Link>
        </nav>
      </header>

      <main id="main">
        <section className="act-open" aria-labelledby="open-heading">
          <div className="open-copy" data-named={named}>
            <h1 id="open-heading" className="display">Build on your name.</h1>
            <p className="lede">A real estate website, and one place for every buyer inquiry.</p>
            <form className="name-form" action="/signup" onSubmit={onBuild}>
              <label htmlFor="visitor-name" className="name-label">Start with your name</label>
              <div className="name-row">
                <input
                  ref={input}
                  id="visitor-name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name…"
                  autoComplete="name"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="go"
                  maxLength={60}
                />
                <button type="submit" className="btn-bone">Build it</button>
              </div>
            </form>
            <a
              href="#yours"
              hidden={named}
              className="skip-link"
              onClick={(e) => {
                e.preventDefault();
                measure();
                glideTo(nameRest());
              }}
            >
              Continue without a name
            </a>
          </div>
        </section>

        <section id="yours" ref={nameSection} className="act-name" aria-labelledby="name-heading">
          <div className="name-pin">
            <p className="nameplate" aria-live="off">{display}</p>
            <div className="name-copy">
              <h2 id="name-heading" className="display display-m">A website worthy of your name.</h2>
              <p className="lede">
                Your name, your photo and your words, on a page of your own at{" "}
                <span className="address">/s/{named ? slugify(name) : "your-name"}</span>.
              </p>
              <div className="name-actions">
                <button type="button" className="btn-bone" onClick={toSite}>See {named && first.length <= 14 ? `${first}’s` : "your"} site</button>
                <button type="button" className="btn-quiet" onClick={editName}>{named ? "Change the name" : "Add your name"}</button>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" ref={demo} className="act-demo" aria-labelledby="demo-heading">
          <div className="demo-stage" data-stage>
            <div className="demo-copy">
              <h2 id="demo-heading" className="display display-s">A buyer asks. It lands with you.</h2>
              <p className="lede lede-s">Send the sample and follow it from their screen to yours.</p>
            </div>
            <div className="demo-grid">
              <div ref={siteWrap} className="panel-wrap panel-wrap-site">
                <SitePanel
                  ref={sitePanel}
                  display={display}
                  named={named}
                  buyer={buyer}
                  message={message}
                  busy={busy}
                  sent={sent}
                  onBuyer={setBuyer}
                  onMessage={setMessage}
                  onSend={onSend}
                  sendRef={sendButton}
                  onPhoto={repaint}
                />
              </div>
              <div ref={inboxWrap} className="panel-wrap panel-wrap-inbox">
                <InboxPanel ref={inboxPanel} display={display} leads={leads} onToggle={toggleContacted} slotRef={slot} />
              </div>
            </div>
          </div>
        </section>

        <section ref={closing} className="act-close" aria-labelledby="close-heading">
          <div className="close-pin">
            <h2 id="close-heading" className="display display-m close-title"><span>Your real estate presence.</span> <span>Every inquiry in one place.</span></h2>
            {sent > 0 && (
              <p className="lede gold-note">
                {sent === 1 ? "That sample is the gold brick in your name." : `Those ${sent} samples are the gold bricks in your name.`} Each one stands for a buyer who asked.
              </p>
            )}
            <div className="name-actions">
              <Link href={signupHref} className="btn-bone">Make my site</Link>
              <Link href="/s/jordan-avery" className="btn-quiet">See a sample site</Link>
            </div>
            <p className="fine">Homes and buyers on this page are fictional. Real MLS listings and email or text delivery are not connected yet, so replies stay in the app for now.</p>
          </div>
        </section>
      </main>

      <footer className="mgb-foot">
        <p>My Golden Brick. Owned by Mike Bjork. Motion prototype for review.</p>
        <p>Sample home photo via Unsplash. All 3D artwork on this page is drawn live in your browser.</p>
      </footer>

      <p className="sr-only" aria-live="polite">{note}</p>

      <div ref={flyer} className="flyer" aria-hidden="true">
        <span className="f-front" /><span className="f-back" /><span className="f-left" /><span className="f-right" /><span className="f-top" /><span className="f-bottom" />
      </div>
    </div>
  );
}
