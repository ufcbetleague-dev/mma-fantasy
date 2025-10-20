import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// TheOddsAPI endpoint for MMA (UFC)
const ODDS_API_URL =
  'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?regions=us&markets=h2h&oddsFormat=american';

export async function GET() {
  try {
    // Fetch latest fight odds
    const res = await fetch(`${ODDS_API_URL}&apiKey=${process.env.ODDS_API_KEY}`);

    if (!res.ok) {
      throw new Error(`Odds API request failed with status ${res.status}`);
    }

    const oddsData = await res.json();

    if (!Array.isArray(oddsData)) {
      console.error('Invalid data from API:', oddsData);
      return NextResponse.json({ error: 'Invalid data from Odds API' }, { status: 500 });
    }

    // Filter only UFC-related fights
    const upcoming = oddsData.filter((ev: any) => ev.sport_key.includes('mma'));

    console.log(`✅ Found ${upcoming.length} UFC fights from TheOddsAPI`);

    // Loop through events and store in Supabase
    for (const ev of upcoming) {
      const eventName = ev.sport_title || 'UFC Event';
      const eventDate = ev.commence_time;

      // Insert or update event record
      const { data: existingEvent, error: eventError } = await supabase
        .from('events')
        .upsert(
          {
            name: eventName,
            event_date: eventDate,
            is_active: true,
          },
          { onConflict: 'name' }
        )
        .select()
        .single();

      if (eventError) {
        console.error('❌ Event insert error:', eventError);
        continue;
      }

      // Insert or update each fight for this event
      for (const bookmaker of ev.bookmakers || []) {
        for (const market of bookmaker.markets || []) {
          if (market.key !== 'h2h') continue;

          const outcomes = market.outcomes || [];
          if (outcomes.length < 2) continue;

          const [fighterA, fighterB] = outcomes;

          const oddsA = fighterA.price ? parseFloat(fighterA.price) : null;
          const oddsB = fighterB.price ? parseFloat(fighterB.price) : null;

          const { error: fightError } = await supabase.from('fights').upsert(
            {
              event_id: existingEvent.id,
              fighter_a: fighterA.name,
              fighter_b: fighterB.name,
              odds_a: oddsA,
              odds_b: oddsB,
            },
            { onConflict: 'event_id,fighter_a,fighter_b' }
          );

          if (fightError) console.error('❌ Fight insert error:', fightError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Fight odds synced successfully from TheOddsAPI',
    });
  } catch (err) {
    console.error('💥 UFC Sync Error:', err);
    return NextResponse.json({ error: 'Failed to fetch fight odds' }, { status: 500 });
  }
}
