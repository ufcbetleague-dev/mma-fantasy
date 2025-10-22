"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

interface Fight {
  id: string;
  fighter1_name: string;
  fighter2_name: string;
  fighter1_odds: number;
  fighter2_odds: number;
  winner: string | null;
}

export default function FightsPage() {
  const { id } = useParams(); // event ID from the URL
  const [fights, setFights] = useState<Fight[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventName, setEventName] = useState<string>("");

  useEffect(() => {
    const fetchFights = async () => {
      setLoading(true);

      // Fetch the event name
      const { data: eventData } = await supabase
        .from("ufc_events")
        .select("name")
        .eq("id", id)
        .single();

      if (eventData) setEventName(eventData.name);

      // Fetch fights tied to that event
      const { data, error } = await supabase
        .from("fights")
        .select("*")
        .eq("event_id", id)
        .order("created_at", { ascending: true });

      if (error) console.error("Error fetching fights:", error);
      else setFights(data || []);

      setLoading(false);
    };

    if (id) fetchFights();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white text-lg">
        Loading fights...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">
        🥋 {eventName || "UFC Event"} Fights
      </h1>

      {fights.length === 0 ? (
        <p className="text-center text-gray-400">No fights found for this event.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {fights.map((fight) => (
            <div
              key={fight.id}
              className="bg-gray-900 p-5 rounded-2xl shadow-md border border-gray-800"
            >
              <h2 className="text-xl font-semibold mb-3 text-center">
                {fight.fighter1_name} <span className="text-gray-400">vs</span>{" "}
                {fight.fighter2_name}
              </h2>

              <div className="flex justify-around text-center text-gray-300">
                <div>
                  <p className="text-sm">Odds</p>
                  <p className="text-lg font-bold text-red-400">
                    {fight.fighter1_odds}
                  </p>
                </div>
                <div>
                  <p className="text-sm">Odds</p>
                  <p className="text-lg font-bold text-blue-400">
                    {fight.fighter2_odds}
                  </p>
                </div>
              </div>

              {fight.winner && (
                <p className="text-green-400 text-center mt-3 font-semibold">
                  Winner: {fight.winner}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link href="/events" className="text-gray-400 hover:text-white underline">
          ← Back to Events
        </Link>
      </div>
    </div>
  );
}
