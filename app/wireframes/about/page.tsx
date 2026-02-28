import { LoFiShell, LoFiBox, LoFiAdSlot } from "../components/LoFiShell";

export default function WireframesAbout() {
  return (
    <LoFiShell title="About / Organization">
      <div className="flex flex-col p-4 gap-6 max-w-2xl">
        <LoFiAdSlot variant="banner" />

        <LoFiBox label="About SMNT">
          <p className="text-sm text-neutral-600">
            [Placeholder: &quot;The Impossible is Always Doable&quot;, National Call, SMNT intro]
          </p>
        </LoFiBox>

        <LoFiBox label="Participating organizations">
          <p className="font-mono text-xs text-neutral-500">[List or cards: UST MC, MFPI, UPM, …]</p>
        </LoFiBox>

        <LoFiBox label="Contact Us">
          <p className="font-mono text-xs text-neutral-500">[Email / form placeholder]</p>
        </LoFiBox>

        <LoFiBox label="Monthly Financial Report">
          <p className="font-mono text-xs text-neutral-500">[Link to PDF or page]</p>
        </LoFiBox>
      </div>
    </LoFiShell>
  );
}
