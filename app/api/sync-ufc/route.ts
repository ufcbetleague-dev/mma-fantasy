import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

const ODDS_API_URL = 'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/events';

export async function GET() {
  try {
    // Fetch upcoming MMA (UFC) events from The Odds API
    const response = await fetch(`${ODDS_API_URL}?apiKey=${process.env.ODDS_API_KEY}&regions=us`);

    if (!response.ok) {
      throw new Error(`The Odds API request failed with status ${response.status}`);
    }

    const events = await response.json();

    if (!Array.isArray(events) || events.length === 0) {
      throw new Error('No UFC events returned from The Odds API.');
    }

    // Format and save events in Supabase
    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      name: event.sport_title,
      event_date: event.commence_time,
      home_team: event.home_team,
      away_team: event.away_team,
      bookmakers: event.bookmakers?.length || 0,
    }));

    const { data, error } = await supabase
      .from('ufc_events')
      .upsert(formattedEvents, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: formattedEvents.length,
    });
  } catch (err: any) {
    console.error('❌ Error syncing UFC events:', err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
