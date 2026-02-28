import Link from "next/link";

export function SMNTHeader() {
  return (
    <>
      <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] h-[90px] flex items-center justify-center">
        <span className="text-sm text-[#A3A3A3]">Ad space — premium</span>
      </div>
      <header className="h-14 border-b border-[#E5E5E5] bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-[#0A0A0A]">
            SMNT
          </Link>
          <nav className="hidden md:flex gap-6 text-[15px] text-[#525252]">
            <Link href="/" className="hover:text-[#0A0A0A]">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#0A0A0A]">
              About
            </Link>
            <Link href="/contact" className="hover:text-[#0A0A0A]">
              Contact
            </Link>
            <Link href="/donors" className="hover:text-[#0A0A0A]">
              Donors
            </Link>
          </nav>
        </div>
      </header>
    </>
  );
}

export function SMNTFooter() {
  return (
    <footer className="border-t border-[#E5E5E5] bg-white px-6 py-4 text-sm text-[#525252]">
      <Link href="/contact" className="hover:text-[#0A0A0A]">Contact</Link>
      {" · "}
      <span>Financial Report</span>
      {" · "}
      <span>Participating Orgs</span>
    </footer>
  );
}

export function AdPlaceholder({ label = "Ad space" }: { label?: string }) {
  return (
    <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] h-[90px] flex items-center justify-center">
      <span className="text-sm text-[#A3A3A3]">{label}</span>
    </div>
  );
}
