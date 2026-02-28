import { LoFiShell, LoFiBox, LoFiAdSlot } from "../components/LoFiShell";

export default function WireframesSupport() {
  return (
    <LoFiShell title="Support / Donors">
      <div className="flex flex-col p-4 gap-6 max-w-2xl">
        <LoFiAdSlot variant="banner" />

        <LoFiBox label="Support SMNT">
          <p className="text-sm text-neutral-600 mb-4">[Short copy: impact, why donate]</p>
          <div className="border-2 border-dashed border-neutral-400 p-6 text-center font-mono text-xs text-neutral-500">
            [GoFundMe — button/link]
          </div>
          <p className="mt-3 text-xs text-neutral-500">Donors / recognition (list or &quot;Coming soon&quot;)</p>
        </LoFiBox>
      </div>
    </LoFiShell>
  );
}
