import { LoFiShell, LoFiBox, LoFiAdSlot } from "../components/LoFiShell";

export default function WireframesExplore() {
  return (
    <LoFiShell title="Explore">
      <div className="flex flex-col p-4 gap-6 max-w-2xl">
        <LoFiAdSlot variant="banner" />

        <LoFiBox label="Submit your route">
          <div className="border-2 border-dashed border-neutral-400 bg-white p-6 mb-3 font-mono text-xs text-neutral-500">
            [Drop GPX file or paste link]
          </div>
          <div className="flex gap-2">
            <span className="border border-neutral-400 px-3 py-1 font-mono text-xs">[Upload]</span>
            <span className="border border-neutral-400 px-3 py-1 font-mono text-xs">[Submit]</span>
          </div>
          <p className="mt-2 text-xs text-neutral-600">
            Status: Pending ocular verification (~1 month). Badge after verification.
          </p>
        </LoFiBox>

        <LoFiBox label="Active Expedition Locator">
          <div className="flex items-center gap-2">
            <span className="border border-neutral-400 w-10 h-5 rounded font-mono text-xs flex items-center justify-center">[Toggle]</span>
            <span className="text-sm">Share my location on map</span>
          </div>
        </LoFiBox>

        <LoFiBox label="Route maker tools">
          <div className="flex flex-wrap gap-4">
            {["Google Map", "All Trails", "Osmand"].map((t) => (
              <div
                key={t}
                className="border-2 border-neutral-400 px-4 py-3 font-mono text-xs min-w-[120px] text-center"
              >
                {t}
              </div>
            ))}
          </div>
        </LoFiBox>
      </div>
    </LoFiShell>
  );
}
