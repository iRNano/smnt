import { LoFiShell, LoFiBox, LoFiAdSlot } from "../components/LoFiShell";

export default function WireframesHome() {
  return (
    <LoFiShell title="Home — Map View">
      <div className="flex flex-col flex-1 p-4 gap-4">
        <LoFiAdSlot variant="banner" />

        <LoFiBox label="Layer toggles + CTAs">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="font-mono text-xs">[Routes] [POIs] [Gradient] [Flora/Fauna] [Live]</span>
            <span className="text-neutral-400">·</span>
            <span className="font-mono text-xs">[Submit route] [Kit]</span>
          </div>
        </LoFiBox>

        <LoFiBox label="MAP CANVAS (horizontal, full-width)" className="min-h-[50vh] flex flex-col">
          <div className="flex-1 flex items-center justify-center gap-8 text-neutral-400 text-sm">
            <span>· · · route segments</span>
            <span>◆ POI markers</span>
          </div>
          <div className="mt-2 text-xs text-neutral-500">
            On hover route → tooltip: &quot;Route name · Explorers: MFPI, UPM&quot;
            <br />
            On click POI → panel: &quot;How to get there&quot; / POI detail
          </div>
        </LoFiBox>

        <LoFiBox label="Legend">
          <div className="flex flex-wrap gap-4 font-mono text-xs">
            <span>[■] Main</span>
            <span>[■] Exit</span>
            <span>[■] Not passable</span>
            <span>[■] User</span>
            <span>[■] Existing</span>
          </div>
        </LoFiBox>
      </div>
    </LoFiShell>
  );
}
