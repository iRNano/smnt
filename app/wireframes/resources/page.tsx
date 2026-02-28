import { LoFiShell, LoFiBox, LoFiAdSlot } from "../components/LoFiShell";

export default function WireframesResources() {
  return (
    <LoFiShell title="Resources">
      <div className="flex flex-col sm:flex-row flex-1 gap-4 p-4">
        <div className="hidden lg:block w-[300px] shrink-0">
          <LoFiAdSlot variant="sidebar" />
        </div>
        <div className="flex-1 space-y-6">
          <LoFiAdSlot variant="banner" />

          <LoFiBox label="Training requests">
            <div className="flex flex-wrap gap-2 font-mono text-xs">
              {["BMC", "AMC", "First Aid", "BLS", "MSAR"].map((t) => (
                <span key={t} className="border border-neutral-400 px-3 py-1">{t}</span>
              ))}
            </div>
          </LoFiBox>

          <LoFiBox label="Explorer's Kit Request">
            <span className="font-mono text-xs">[Maps, Guides, Tips]</span>
            <span className="ml-2 border border-neutral-400 px-3 py-1 font-mono text-xs">[Request]</span>
          </LoFiBox>

          <LoFiBox label="Itemized expenses request">
            <span className="font-mono text-xs">[Form link]</span>
          </LoFiBox>

          <LoFiBox label="Climb Report Form">
            <span className="font-mono text-xs">[Form link]</span>
          </LoFiBox>

          <LoFiBox label="Accredited guides">
            <span className="font-mono text-xs">[List by area] [Register]</span>
          </LoFiBox>

          <LoFiBox label="Password-protected resources">
            <span className="font-mono text-xs">[Login]</span>
          </LoFiBox>
        </div>
      </div>
    </LoFiShell>
  );
}
