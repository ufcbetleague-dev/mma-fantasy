"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

interface Event {
  id: string;
  name: string;
  event_date: string;
  home_team: string;
  away_team: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("ufc_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) console.error("Error fetching events:", error);
      else setEvents(data || []);
      setLoading(false);
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading events...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-6">🥋 Upcoming UFC Events</h1>

      {events.length === 0 ? (
        <p className="text-center text-gray-400">No events found.</p>
      ) : (
        <div className="grid gap-4 max-w-2xl mx-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className="border border-gray-700 rounded-2xl p-4 bg-gray-900 hover:bg-gray-800 transition-all"
            >
              <h2 className="text-xl font-semibold mb-2">{event.name}</h2>
              <p className="text-gray-400">
                {new Date(event.event_date).toLocaleString()}
              </p>
              <p className="text-gray-400">
                {event.home_team} vs {event.away_team}
              </p>

              <Link
                href={`/events/${event.id}/fights`}
                className="mt-4 inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
              >
                View Fights →
              </Link>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-10">
        <Link
          href="/"
          className="text-gray-400 hover:text-white underline transition"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
