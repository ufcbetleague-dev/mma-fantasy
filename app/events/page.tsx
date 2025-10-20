'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Event {
  id: string;
  name: string;
  event_date: string;
  is_active: boolean;
  max_picks?: number;
  total_stake_cents?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      console.log('Supabase data:', data);
      console.log('Supabase error:', error);

      if (error) {
        console.error('Error loading events:', error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoading(false);
    }

    loadEvents();
  }, []);

  if (loading) {
    return <p className="p-6 text-center">Loading events...</p>;
  }

  if (events.length === 0) {
    return <p className="p-6 text-center">No events found.</p>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Upcoming Events</h1>
      <ul className="space-y-2">
        {events.map((event) => (
          <li key={event.id} className="border p-4 rounded-md bg-gray-800">
            <h2 className="text-xl">{event.name}</h2>
            <p>Date: {new Date(event.event_date).toLocaleString()}</p>
            <p>Status: {event.is_active ? 'Active' : 'Inactive'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
