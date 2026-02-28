"use client";

import dynamic from "next/dynamic";

const SMNTMapClient = dynamic(() => import("./SMNTMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[60vh] w-full items-center justify-center bg-[#0F1419] text-[#A3A3A3]">
      Loading map…
    </div>
  ),
});

export function SMNTMapDynamic() {
  return (
    <div className="h-full w-full min-h-[60vh]">
      <SMNTMapClient />
    </div>
  );
}
