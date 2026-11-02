import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-5 py-28 sm:px-10">
      <h1 className="text-head font-extrabold tracking-[-0.04em]">We couldn’t find that page</h1>
      <p className="mt-4 max-w-[44ch] text-body text-muted">The home may have sold, or the link may be out of date.</p>
      <Link href="/" className="press rounded-lg mt-6 inline-flex h-12 items-center bg-accent hover:brightness-110 px-6 font-semibold text-accent-ink">Go to the home page</Link>
    </div>
  );
}
