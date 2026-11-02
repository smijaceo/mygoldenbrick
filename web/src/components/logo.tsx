/**
 * The imakepage logo: the company's gold brick mark (from imakepage.com) beside the name in
 * Inter. The image is decorative; the wrapper carries the name for screen readers.
 */
export function Logo({
  variant = "full",
  className = "",
}: {
  variant?: "full" | "mark";
  className?: string;
}) {
  return (
    <span role="img" aria-label="imakepage" translate="no" className={`inline-flex items-center gap-[0.35em] font-bold tracking-[-0.02em] leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/brick.png" alt="" width={64} height={64} className="size-[1.6em] shrink-0" />
      {variant === "full" && <span aria-hidden="true">imakepage</span>}
    </span>
  );
}
