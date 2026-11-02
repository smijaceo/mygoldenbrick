"use client";

import { useEffect } from "react";

/**
 * Entrance for every section’s parts: each [data-enter] element rises in once as it reaches
 * the viewport, staggered 100ms within its section (better-ui values). The hidden start state
 * only applies once this script has run (html.motion-ready), so content never stays hidden if
 * JavaScript fails. Elements added later (client navigation, new search results) are picked up
 * by a MutationObserver. Reduced motion gets an opacity fade only (see globals.css).
 */
export function Motion() {
  useEffect(() => {
    const seen = new WeakSet<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    const register = (root: ParentNode) => {
      const groups = new Map<Element, number>();
      const fresh = [...root.querySelectorAll<HTMLElement>("[data-enter]")].filter((el) => !seen.has(el));
      // Read every position first, then write, so the browser lays out once, not once per element.
      const onScreen = fresh.map((el) => el.getBoundingClientRect().top < window.innerHeight);
      fresh.forEach((el, i) => {
        seen.add(el);
        const section = el.closest("section, header, footer, figure") ?? document.body;
        const index = groups.get(section) ?? 0;
        groups.set(section, index + 1);
        el.style.transitionDelay = `${Math.min(index, 4) * 100}ms`;
        // Anything already on screen enters now (on the next frame, so the fade still runs).
        if (onScreen[i]) {
          requestAnimationFrame(() => el.classList.add("is-in"));
        } else {
          io.observe(el);
        }
      });
    };

    // Looping animations pause while they are off screen.
    const loops = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
    });
    document.querySelectorAll(".drift, .caret-blink").forEach((el) => loops.observe(el));

    register(document);
    document.documentElement.classList.add("motion-ready");
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && register(n.parentElement ?? n));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      loops.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
