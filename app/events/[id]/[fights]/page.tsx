"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function EventFightsPage({ params }: { params: { id: string } }) {
  const [fights, setFights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFights() {
      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("fights")
          .select("*")
          .eq("event_id", params.id);

        if (error) throw error;

        setFights(data || []);
      } catch (err) {
        console.error("Error fetching fights:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFights();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading fights...
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-8 flex items-center">
        🥊 UFC Event Fights
      </h1>

      {fights.length === 0 ? (
        <p className="text-gray-400 text-lg">No fights found for this event.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 w-full max-w-2xl">
          {fights.map((fight) => (
            <div
              key={`${fight.fighter1_name}-${fight.fighter2_name}`}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2 text-center">
                {fight.fighter1_name} vs {fight.fighter2_name}
              </h2>
              <div className="flex justify-around text-gray-300 text-sm">
                <div className="text-center">
                  <p className="font-bold">{fight.fighter1_name}</p>
                  <p>Odds: {fight.fighter1_odds}</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{fight.fighter2_name}</p>
                  <p>Odds: {fight.fighter2_odds}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/events"
        className="mt-10 text-red-400 hover:text-red-300 transition-colors"
      >
        ← Back to Events
      </Link>
    </main>
  );
}
