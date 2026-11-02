"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Monitor, Smartphone, TriangleAlert } from "lucide-react";
import { saveSite } from "../actions";
import type { EditableField } from "@/lib/sites";
import type { Site } from "@/lib/types";
import { DEFAULT_ACCENT, THEMES, accentAfterThemeChange, accentInk, contrast, isThemeId, themeVars, type ThemeId } from "@/lib/themes";
import { Card, Field, buttonClass, cx, inputClass } from "@/components/ui";

type Values = Record<EditableField, string>;

/** Accent picks offered beside the theme’s own bronze. The agent can also type any colour. */
/** Button colours offered beside the theme's default. The agent can also type any colour. */
const ACCENTS = [
  { name: "Ink", value: "#111827" },
  { name: "Gold", value: "#d4a843" },
  { name: "Navy", value: "#1e3a5f" },
  { name: "Green", value: "#2e6b4f" },
  { name: "Brick", value: "#9a3b1b" },
];

const HERO_PICKS = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
];

const SECTIONS = ["Look", "Home page", "About you", "Contact", "Google"] as const;
const tabId = (s: string) => `tab-${s.replace(/\s+/g, "-").toLowerCase()}`;
type Section = (typeof SECTIONS)[number];

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved"; at: string } | { kind: "error" };

const HEX = /^#[0-9a-f]{6}$/i;

export function Editor({ site, slug }: { site: Site; slug: string }) {
  const [values, setValues] = useState<Values>(() => {
    const v = {} as Values;
    for (const [k, val] of Object.entries(site)) (v as Record<string, string>)[k] = String(val ?? "");
    return v;
  });
  const [section, setSection] = useState<Section>("Look");
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Partial<Record<EditableField, string>>>({});
  const pending = useRef<Partial<Values>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [, start] = useTransition();

  function flush() {
    const changes = pending.current;
    pending.current = {};
    if (!Object.keys(changes).length) return;
    setStatus({ kind: "saving" });
    start(async () => {
      try {
        const res = await saveSite(changes);
        if (res.ok) {
          setErrors((e) => {
            const next = { ...e };
            for (const k of Object.keys(changes)) delete next[k as EditableField];
            return next;
          });
          setStatus({ kind: "saved", at: res.savedAt });
          frame.current?.contentWindow?.location.reload();
        } else {
          setErrors((e) => ({ ...e, ...res.errors }));
          setStatus({ kind: "error" });
        }
      } catch {
        // Keep the unsaved changes so the next edit retries them.
        pending.current = { ...changes, ...pending.current };
        setStatus({ kind: "error" });
      }
    });
  }

  function set(field: EditableField, value: string, immediate = false) {
    setValues((v) => ({ ...v, [field]: value }));
    pending.current[field] = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, immediate ? 0 : 700);
  }

  // Save anything still pending when the agent moves to another page in the app,
  // switches tabs, or closes the window.
  useEffect(() => {
    const sendPending = () => {
      if (timer.current) clearTimeout(timer.current);
      const changes = pending.current;
      pending.current = {};
      if (Object.keys(changes).length) void saveSite(changes);
    };
    const warn = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length) {
        sendPending();
        e.preventDefault();
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") sendPending();
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("visibilitychange", onHide);
      sendPending();
    };
  }, []);

  const theme: ThemeId = isThemeId(values.theme) ? values.theme : "dark";
  const accent = HEX.test(values.accent_color) ? values.accent_color : DEFAULT_ACCENT[theme];

  function pickTheme(next: ThemeId) {
    if (next === theme) return;
    const nextAccent = accentAfterThemeChange(accent, theme, next);
    setValues((v) => ({ ...v, theme: next, accent_color: nextAccent }));
    pending.current.theme = next;
    pending.current.accent_color = nextAccent;
    flush();
  }

  const text = (field: EditableField, label: string, opts: { hint?: string; multiline?: boolean; placeholder?: string; max?: number; type?: "text" | "tel" | "email" | "url" } = {}) => (
    <Field
      label={label}
      error={errors[field]}
      hint={opts.max ? `${values[field].length}/${opts.max} characters${opts.hint ? `. ${opts.hint}` : ""}` : opts.hint}
    >
      {opts.multiline ? (
        <textarea name={field} rows={5} value={values[field]} maxLength={opts.max} placeholder={opts.placeholder} onChange={(e) => set(field, e.target.value)} className={inputClass} />
      ) : (
        <input
          name={field}
          type={opts.type ?? "text"}
          autoComplete="off"
          spellCheck={opts.type === "email" || opts.type === "url" ? false : undefined}
          value={values[field]}
          maxLength={opts.max}
          placeholder={opts.placeholder}
          onChange={(e) => set(field, e.target.value)}
          className={inputClass}
        />
      )}
    </Field>
  );

  // The theme's default leads the row; a preset equal to it is not shown twice.
  const accents = [{ name: "Default", value: DEFAULT_ACCENT[theme] }, ...ACCENTS.filter((a) => a.value !== DEFAULT_ACCENT[theme])];
  const onGround = contrast(accent, THEMES[theme].ground);

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <SaveStatus status={status} />
          <a href={`/s/${slug}`} target="_blank" rel="noopener" className={buttonClass("secondary", "sm")}>
            Open site <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>

        <div className="flex gap-1 overflow-x-auto border-b border-rule sm:gap-3" role="tablist" aria-label="Website sections">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              id={tabId(s)}
              aria-selected={section === s}
              aria-controls="editor-panel"
              onClick={() => setSection(s)}
              className={cx(
                "-mb-px h-10 flex-none whitespace-nowrap border-b-2 px-1 text-sm font-semibold transition-colors",
                section === s ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        <Card className="flex flex-col gap-5 p-5" role="tabpanel" id="editor-panel" aria-labelledby={tabId(section)}>
          {section === "Look" && (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-semibold text-ink">Theme</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                    <label key={id} className={cx("cursor-pointer rounded-md p-1 outline-2 transition-colors has-[:focus-visible]:outline-accent", theme === id ? "outline-ink" : "outline-transparent hover:outline-input")}>
                      <input type="radio" name="theme" value={id} checked={theme === id} onChange={() => pickTheme(id)} className="sr-only" />
                      {/* A small picture of the theme: its ground, its ink and the accent the site will use. */}
                      <span aria-hidden="true" style={themeVars(id, accentAfterThemeChange(accent, theme, id))} className="block rounded-sm bg-ground p-3">
                        <span className="block text-lg font-extrabold leading-none tracking-[-0.04em] text-ink">Homes</span>
                        <span className="mt-2 block h-1.5 w-3/4 bg-surface" />
                        <span className="mt-1.5 block h-1.5 w-1/2 bg-surface" />
                        <span className="mt-3 block h-4 w-12 bg-accent" />
                      </span>
                      <span className="mt-2 block px-1 pb-1 text-sm font-semibold text-ink">{THEMES[id].name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="flex flex-col gap-3">
                <legend className="mb-2 text-sm font-semibold text-ink">Button colour</legend>
                <div className="flex flex-wrap gap-1">
                  {accents.map((a) => (
                    <label key={a.name} className={cx("flex h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm outline-2 -outline-offset-2 transition-colors has-[:focus-visible]:outline-accent", accent.toLowerCase() === a.value ? "text-ink outline-ink" : "text-muted outline-transparent hover:text-ink hover:outline-input")}>
                      <input type="radio" name="accent" value={a.value} checked={accent.toLowerCase() === a.value} onChange={() => set("accent_color", a.value, true)} className="sr-only" />
                      <span aria-hidden="true" className="size-4 rounded-sm" style={{ background: a.value }} />
                      {a.name}
                    </label>
                  ))}
                </div>
                <div role="group" aria-labelledby="accent-custom" className="flex flex-col gap-2">
                  <span id="accent-custom" className="text-sm font-semibold text-ink">Or any colour</span>
                  <span className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) => set("accent_color", e.target.value)}
                      className="h-9 w-12 flex-none cursor-pointer rounded-md border border-input bg-ground p-1"
                      aria-label="Accent colour picker"
                    />
                    <input
                      name="accent_color"
                      value={values.accent_color}
                      onChange={(e) => set("accent_color", e.target.value)}
                      spellCheck={false}
                      autoComplete="off"
                      aria-label="Accent colour code"
                      aria-invalid={errors.accent_color ? true : undefined}
                      aria-describedby={errors.accent_color ? "accent-error" : undefined}
                      className={inputClass}
                    />
                  </span>
                  {errors.accent_color && <span id="accent-error" role="alert" className="text-sm text-danger">{errors.accent_color}</span>}
                </div>
                {/* What the setting produces: the site’s main button in this theme and colour. */}
                <div style={themeVars(theme, accent)} className="flex flex-wrap items-center gap-3 rounded-md bg-ground p-3">
                  <span className="inline-flex h-10 items-center bg-accent px-4 text-sm font-semibold text-accent-ink">Search homes</span>
                  <span className="text-sm text-muted">Button text switches to {accentInk(accent, theme) === "#ffffff" ? "white" : "dark"} so it stays readable.</span>
                </div>
                {onGround < 3 && (
                  <p className="flex items-start gap-2 text-sm text-ink">
                    <TriangleAlert size={16} className="mt-0.5 flex-none text-danger" aria-hidden="true" />
                    This colour is faint on the {THEMES[theme].name} background, so your site uses the text colour for links and focus rings instead.
                  </p>
                )}
              </fieldset>

              {text("brokerage", "Brokerage or team name", { placeholder: "Avery Home Group…" })}
              {text("title", "Your title", { placeholder: "REALTOR®, Nebraska…" })}
              {text("photo_url", "Your headshot (image link)", { type: "url", placeholder: "https://…", hint: "Leave empty to show your initials." })}
            </>
          )}

          {section === "Home page" && (
            <>
              {text("headline", "Headline", { max: 80 })}
              {text("subheadline", "Supporting line", { max: 160 })}
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-sm font-semibold text-ink">Background photo</legend>
                <div className="grid grid-cols-4 gap-2">
                  {HERO_PICKS.map((url, i) => (
                    <label key={url} className={cx("aspect-[4/3] cursor-pointer overflow-hidden rounded-sm outline-2 outline-offset-2 transition-colors has-[:focus-visible]:outline-accent", values.hero_image === url ? "outline-ink" : "outline-transparent hover:outline-input")}>
                      <input type="radio" name="hero" checked={values.hero_image === url} onChange={() => set("hero_image", url, true)} className="sr-only" aria-label={`Photo ${i + 1}`} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`${url}?w=200&q=60&auto=format&fit=crop`} alt="" width={200} height={150} className="h-full w-full object-cover" />
                    </label>
                  ))}
                </div>
              </fieldset>
              {text("hero_image", "Or paste an image link", { type: "url", placeholder: "https://…" })}
            </>
          )}

          {section === "About you" && (
            <>
              {text("bio", "Your story", { multiline: true, max: 1200, hint: "Write it the way you’d say it to a client." })}
              {text("service_area", "Areas you serve", { placeholder: "Omaha, Elkhorn, Papillion…" })}
            </>
          )}

          {section === "Contact" && (
            <>
              {text("phone", "Phone", { type: "tel", placeholder: "(402) 555-0100…" })}
              {text("public_email", "Email shown on your site", { type: "email" })}
              {text("office_address", "Office address")}
              <p className="text-sm text-muted">Messages from your contact form go straight to your Leads inbox.</p>
            </>
          )}

          {section === "Google" && (
            <>
              {text("seo_title", "Page title in Google", { max: 60 })}
              {text("seo_description", "Description in Google", { multiline: true, max: 160 })}
              <div className="rounded-md bg-ground p-4">
                <p className="mb-1 text-xs text-muted">How it may look in Google</p>
                <p className="truncate text-lg text-ink">{values.seo_title || "Your page title"}</p>
                <p className="line-clamp-2 text-sm text-muted">{values.seo_description || "Your description"}</p>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="hidden xl:block">
        <div className="sticky top-20">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">Live preview</p>
            <div className="flex gap-1">
              {([["desktop", Monitor, "Desktop"], ["phone", Smartphone, "Phone"]] as const).map(([d, Icon, label]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-label={`${label} preview`}
                  aria-pressed={device === d}
                  className={cx("flex size-8 items-center justify-center rounded-md transition-colors", device === d ? "bg-raised text-ink" : "text-muted hover:text-ink")}
                >
                  <Icon size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center overflow-hidden rounded-lg bg-surface">
            <iframe
              ref={frame}
              src={`/s/${slug}?preview=1`}
              title="Website preview"
              className={cx("h-[calc(100dvh-10rem)] bg-ground", device === "phone" ? "w-[390px]" : "w-full")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  return (
    <span aria-live="polite" className="text-sm">
      {status.kind === "saving" ? (
        <span className="flex items-center gap-1.5 text-muted"><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Saving…</span>
      ) : status.kind === "saved" ? (
        <span className="flex items-center gap-1.5 text-ink"><Check size={14} aria-hidden="true" /> All changes saved</span>
      ) : status.kind === "error" ? (
        <span className="flex items-center gap-1.5 text-danger"><TriangleAlert size={14} aria-hidden="true" /> Some changes weren’t saved</span>
      ) : (
        <span className="text-muted">Changes save as you type</span>
      )}
    </span>
  );
}
