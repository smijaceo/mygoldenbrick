import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 py-12">
      <Link href="/" aria-label="imakepage home" className="mb-8 text-2xl text-ink">
        <Logo />
      </Link>
      <main id="main" className="w-full max-w-sm rounded-2xl border border-rule bg-ground p-6 sm:p-8">
        {children}
      </main>
    </div>
  );
}
