import Link from "next/link";

export function SMNTHeader() {
  return (
    <>
      <div className="bg-[#F5F5F5] border-b border-[#E5E5E5] h-[90px] flex items-center justify-center">
        <span className="text-sm text-[#A3A3A3]">Ad space — premium</span>
      </div>
      <header className="h-14 border-b border-[#E5E5E5] bg-white flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="font-heading text-xl font-bold uppercase tracking-wide text-[#2C2626]"
          >
            SMNT
          </Link>
          <nav className="hidden md:flex gap-6 font-heading text-sm font-semibold uppercase tracking-wide text-[#525252]">
            <Link href="/" className="hover:text-[#F79F17]">
              Home
            </Link>
            <Link href="/explore" className="hover:text-[#F79F17]">
              Explore
            </Link>
            <Link href="/about" className="hover:text-[#F79F17]">
              About
            </Link>
            <Link href="/contact" className="hover:text-[#F79F17]">
              Contact
            </Link>
            <Link href="/donors" className="hover:text-[#F79F17]">
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
    <footer className="bg-[#181818] px-6 py-5 text-sm text-[#999999]">
      <Link href="/contact" className="hover:text-[#F79F17]">Contact</Link>
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
