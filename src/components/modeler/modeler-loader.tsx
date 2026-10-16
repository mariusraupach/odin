"use client";

import dynamic from "next/dynamic";

// The plan lives in localStorage, so render the modeler on the client only.
export const ModelerLoader = dynamic(() => import("./modeler"), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-dvh items-center justify-center text-sm">
      Loading modeler…
    </div>
  ),
});
