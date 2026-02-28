import Link from "next/link";

export function LoFiShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-800">
      <header className="border-b border-neutral-300 bg-white px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/wireframes" className="font-mono font-bold text-sm">
            [Logo] SMNT
          </Link>
          <nav className="hidden sm:flex gap-4 font-mono text-xs">
            <Link href="/wireframes/home" className="hover:underline">Home</Link>
            <Link href="/wireframes/explore" className="hover:underline">Explore</Link>
            <Link href="/wireframes/resources" className="hover:underline">Resources</Link>
            <Link href="/wireframes/operations" className="hover:underline">Operations</Link>
            <Link href="/wireframes/support" className="hover:underline">Support</Link>
            <Link href="/wireframes/about" className="hover:underline">About</Link>
          </nav>
        </div>
        <span className="font-mono text-xs text-neutral-500">[···]</span>
      </header>
      <main className="flex-1 flex flex-col">
        {title && (
          <div className="px-4 py-2 bg-neutral-200 border-b border-neutral-300 font-mono text-xs">
            LoFi: {title}
          </div>
        )}
        {children}
      </main>
      <footer className="border-t border-neutral-300 bg-white px-4 py-3 font-mono text-xs text-neutral-500">
        Contact · Financial Report · Participating Orgs
      </footer>
    </div>
  );
}

export function LoFiBox({
  children,
  className = "",
  label,
}: {
  children?: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={`border-2 border-dashed border-neutral-400 bg-neutral-50 p-4 ${className}`}
      title={label}
    >
      {label && (
        <div className="font-mono text-xs text-neutral-500 mb-2">{label}</div>
      )}
      {children}
    </div>
  );
}

export function LoFiAdSlot({ variant = "banner" }: { variant?: "banner" | "sidebar" }) {
  return (
    <LoFiBox
      label={variant === "banner" ? "Ad slot — premium/banner" : "Ad slot — sidebar"}
      className={variant === "sidebar" ? "w-full max-w-[300px] min-h-[250px]" : "min-h-[90px]"}
    >
      <div className="flex items-center justify-center h-full min-h-[60px] text-neutral-400">
        Ad space
      </div>
    </LoFiBox>
  );
}
