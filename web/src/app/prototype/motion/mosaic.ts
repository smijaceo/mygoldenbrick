/**
 * Paints a panel's real layout onto a canvas, so the picture on the bricks is the page that
 * replaces them. It covers what these panels use: fills, rounded corners, photographs, text.
 */
export function paintPanel(panel: HTMLElement): HTMLCanvasElement | null {
  const box = panel.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(box.width);
  canvas.height = Math.round(box.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const walk = (el: Element) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;
    const rect = el.getBoundingClientRect();
    const x = rect.left - box.left;
    const y = rect.top - box.top;
    const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;

    if (style.backgroundColor && style.backgroundColor !== "rgba(0, 0, 0, 0)" && style.backgroundColor !== "transparent") {
      ctx.fillStyle = style.backgroundColor;
      ctx.beginPath();
      ctx.roundRect(x, y, rect.width, rect.height, radius);
      ctx.fill();
    }
    const borderWidth = Number.parseFloat(style.borderTopWidth) || 0;
    if (borderWidth > 0 && style.borderTopStyle !== "none") {
      ctx.strokeStyle = style.borderTopColor;
      ctx.lineWidth = borderWidth;
      ctx.beginPath();
      ctx.roundRect(x + borderWidth / 2, y + borderWidth / 2, rect.width - borderWidth, rect.height - borderWidth, radius);
      ctx.stroke();
    }

    if (el instanceof HTMLImageElement && el.complete && el.naturalWidth > 0) {
      // The same crop as object-fit: cover.
      const fit = Math.max(rect.width / el.naturalWidth, rect.height / el.naturalHeight);
      const sw = rect.width / fit;
      const sh = rect.height / fit;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, rect.width, rect.height, radius);
      ctx.clip();
      ctx.drawImage(el, (el.naturalWidth - sw) / 2, (el.naturalHeight - sh) / 2, sw, sh, x, y, rect.width, rect.height);
      ctx.restore();
    }

    if ((el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) && el.value) {
      ctx.fillStyle = style.color;
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.letterSpacing = "0px";
      ctx.textBaseline = "top";
      ctx.fillText(el.value.slice(0, 44), x + (Number.parseFloat(style.paddingLeft) || 0), y + (Number.parseFloat(style.paddingTop) || 0), rect.width - 16);
    }

    for (const node of el.childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) walk(node as Element);
      else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) paintText(node as Text, style);
    }
  };

  const paintText = (node: Text, style: CSSStyleDeclaration) => {
    const text = node.textContent ?? "";
    ctx.fillStyle = style.color;
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ctx.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
    ctx.textBaseline = "alphabetic";
    const range = document.createRange();
    // Word by word, so wrapped lines land where the browser put them.
    const pattern = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text))) {
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const r = range.getBoundingClientRect();
      if (r.width === 0) continue;
      ctx.fillText(match[0], r.left - box.left, r.top - box.top + r.height * 0.78);
    }
  };

  for (const child of panel.children) walk(child);
  return canvas;
}
