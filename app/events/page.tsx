'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events from Supabase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('ufc_events')
          .select('*')
          .order('event_date', { ascending: true });

        if (error) throw error;
        setEvents(data || []);
      } catch (err) {
        console.error('Error loading events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <h2 className="text-2xl font-semibold">Loading UFC Events...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">🏆 Upcoming UFC Events</h1>

      {events.length === 0 ? (
        <p className="text-center text-gray-400">
          No events found. Try syncing again from the homepage.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-lg hover:shadow-red-500/40 transition"
            >
              <h2 className="text-xl font-semibold mb-2 text-red-400">
                {event.name || 'Unnamed Event'}
              </h2>
              <p className="text-sm text-gray-300">
                📅 {new Date(event.event_date).toLocaleString()}
              </p>
              {event.home_team && event.away_team && (
                <p className="text-gray-400 mt-2">
                  🥊 {event.home_team} vs {event.away_team}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Bookmakers: {event.bookmakers || 0}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
