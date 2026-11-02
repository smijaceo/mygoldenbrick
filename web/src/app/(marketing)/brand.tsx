export const BRAND_NAME = "My Golden Brick";

/**
 * The landing page's name, beside the gold brick. Only this page is My Golden Brick so far;
 * sign-in, the back office and agent sites keep the shared Logo (imakepage) for now.
 */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <span translate="no" className={`font-display inline-flex items-center gap-[0.4em] leading-none ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/brick.png" alt="" width={64} height={64} className="size-[1.5em] shrink-0" />
      {BRAND_NAME}
    </span>
  );
}
