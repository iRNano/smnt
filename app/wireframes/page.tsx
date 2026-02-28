import Link from "next/link";

export default function WireframesIndex() {
  const screens = [
    { href: "/wireframes/home", name: "Home (Map)", desc: "Interactive map, legend, layer toggles, POI panel" },
    { href: "/wireframes/explore", name: "Explore", desc: "Submit GPX, Expedition Locator, Route maker links" },
    { href: "/wireframes/resources", name: "Resources", desc: "Training, Explorer's Kit, forms, guides" },
    { href: "/wireframes/operations", name: "Operations", desc: "SAR info and coordination" },
    { href: "/wireframes/support", name: "Support / Donors", desc: "Donors, GoFundMe" },
    { href: "/wireframes/about", name: "About / Organization", desc: "About, Contact, Financial Report" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 text-neutral-800">
      <header className="border-b border-neutral-300 bg-white px-4 py-3">
        <Link href="/" className="font-mono font-bold text-sm hover:underline">
          ← Back to app
        </Link>
      </header>
      <main className="flex-1 p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-bold font-mono mb-1">LoFi Wireframes</h1>
        <p className="text-sm text-neutral-600 mb-6">
          Based on <code className="bg-neutral-200 px-1">docs/UI_UX_FLOW.md</code>. Click to view each screen.
        </p>
        <ul className="space-y-3">
          {screens.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block border-2 border-neutral-300 bg-white p-4 hover:border-neutral-500 hover:bg-neutral-50 font-mono text-sm"
              >
                <span className="font-semibold">{s.name}</span>
                <span className="block text-neutral-500 font-sans text-xs mt-1">{s.desc}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-xs text-neutral-500">
          <Link href="/design" className="underline">HiFi design preview</Link> →
        </p>
      </main>
    </div>
  );
}
