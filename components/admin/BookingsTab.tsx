"use client";

import { useState } from "react";
import { Gift, Ticket } from "lucide-react";
import { RequestsManager } from "@/components/admin/RequestsManager";
import { RewardOrdersManager } from "@/components/admin/RewardOrdersManager";

/** Admin → Bookings: trip bookings and souvenir orders, both paid by bank transfer. */
export function BookingsTab() {
  const [view, setView] = useState<"trips" | "souvenirs">("trips");
  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Bookings" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#DDE5BE] p-1">
        {(
          [
            ["trips", "Trips", <Ticket key="i" className="h-4 w-4" />],
            ["souvenirs", "Souvenirs", <Gift key="i" className="h-4 w-4" />],
          ] as const
        ).map(([id, label, icon]) => (
          <button
            key={id}
            role="tab"
            aria-selected={view === id}
            onClick={() => setView(id)}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${
              view === id ? "bg-[#0D2A1F] text-white shadow" : "text-[#12372A]"
            }`}
          >
            {icon}
            <span key={label}>{label}</span>
          </button>
        ))}
      </div>
      {view === "trips" ? <RequestsManager /> : <RewardOrdersManager />}
    </div>
  );
}
