import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const UFC_EVENTS_API = 'https://api.sportsdata.io/v4/mma/scores/json/UpcomingEvents';

export async function GET() {
  try {
    // Fetch upcoming UFC events from the SportsData API
    const res = await fetch(`${UFC_EVENTS_API}?key=${process.env.ODDS_API_KEY}`);

    if (!res.ok) {
      throw new Error(`UFC API request failed with status ${res.status}`);
    }

    const events = await res.json();

    if (!Array.isArray(events)) {
      throw new Error('Unexpected API response format');
    }

    // Upsert events into Supabase (ignore type warnings)
    const { data, error } = await supabase
      .from('ufc_events')
      .upsert(
        events.map((event: any) => ({
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
