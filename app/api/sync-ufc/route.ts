import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const UFC_EVENTS_API = 'https://api.sportsdata.io/v4/mma/scores/json/Schedule/UFC';

export async function GET() {
  try {
    // Fetch all UFC events from SportsData.io
    const res = await fetch(`${UFC_EVENTS_API}?key=${process.env.ODDS_API_KEY}`);

    if (!res.ok) {
      throw new Error(`UFC API request failed with status ${res.status}`);
    }

    const events = await res.json();

    if (!Array.isArray(events)) {
      throw new Error('Unexpected API response format.');
    }

    // Filter for future (upcoming) events only
    const upcoming = events.filter((event: any) => {
      const eventDate = new Date(event.Day);
      return eventDate >= new Date();
    });

    // Insert or update them in Supabase
    const { data, error } = await supabase
      .from('ufc_events')
      .upsert(
        upcoming.map((event: any) => ({
          id: event.EventId,
          name: event.Name,
          date: event.Day,
          location: event.Location,
          status: event.Status,
        })),
        { onConflict: 'id' }
      );

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data ? data.length : 0,
    });
  } catch (err: any) {
    console.error('❌ Error syncing UFC events:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
