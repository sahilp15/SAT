"use client";

import { useState } from "react";

// Desmos calculator panel.
//
// IMPORTANT (legal/technical note): The College Board *testing* calculator at
// https://www.desmos.com/testing/collegeboard/graphing is a restricted build
// that Desmos/College Board do not license for third-party embedding, so we do
// NOT embed it. Instead we embed the standard, publicly embeddable Desmos
// graphing calculator (https://www.desmos.com/calculator), which is the closest
// compliant equivalent and exposes the same graphing/regression workflow the SAT
// expects. If you later obtain a Desmos API key, this component can be upgraded
// to the GraphingCalculator JS API for deeper integration.

export function DesmosPanel() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button type="button" className="btn-secondary" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide Desmos calculator" : "Open Desmos calculator"}
      </button>
      {open ? (
        <div className="mt-2 overflow-hidden rounded-lg border border-slate-300">
          <iframe
            title="Desmos Graphing Calculator"
            src="https://www.desmos.com/calculator"
            className="h-[460px] w-full"
            loading="lazy"
          />
        </div>
      ) : null}
    </div>
  );
}
