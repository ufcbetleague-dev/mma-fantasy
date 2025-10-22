import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// TheOddsAPI endpoint for MMA (UFC)
const ODDS_API_URL =
  'https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?regions=us&markets=h2h&oddsFormat=american';

export async function GET() {
  try {
    console.log('🔄 Syncing UFC odds from TheOddsAPI...');

    // Fetch data from TheOddsAPI
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
      try {
        // Extract event name and date
        const eventName = ev.sport_title || 'UFC Event';
        const eventDate = ev.commence_time;

        // Try to match event by UFC number (e.g. "UFC 312")
        const ufcNumberMatch = ev.sport_title.match(/UFC\s*\d+/i);
        let matchedEventId: string | null = null;

        if (ufcNumberMatch) {
          const ufcNumber = ufcNumberMatch[0].toUpperCase();

          const { data: existingEvent, error: fetchError } = await supabase
            .from('events')
            .select('id, name')
            .ilike('name', `%${ufcNumber}%`)
            .maybeSingle();

          if (!fetchError && existingEvent) {
            matchedEventId = existingEvent.id;
            console.log(`🔗 Matched existing event: ${existingEvent.name}`);
          }
        }

        // If not found, create a new event record
        if (!matchedEventId) {
          const { data: newEvent, error: eventError } = await supabase
            .from('events')
            .insert({
              name: eventName,
              event_date: eventDate,
              is_active: true,
            })
            .select()
            .single();

          if (eventError) {
            console.error('❌ Event insert error:', eventError);
            continue;
          }

          matchedEventId = newEvent.id;
          console.log(`🆕 Created new event: ${eventName}`);
        }

        // Now insert or update each fight for this event
        for (const bookmaker of ev.bookmakers || []) {
          for (const market of bookmaker.markets || []) {
            if (market.key !== 'h2h') continue;

            const outcomes = market.outcomes || [];
            if (outcomes.length < 2) continue;

            const [fighterA, fighterB] = outcomes;

            // Parse odds values
            const oddsA = fighterA.price ? parseFloat(fighterA.price) : null;
            const oddsB = fighterB.price ? parseFloat(fighterB.price) : null;

            const { error: fightError } = await supabase.from('fights').upsert(
              {
                event_id: matchedEventId,
                fighter_a: fighterA.name,
                fighter_b: fighterB.name,
                odds_a: oddsA,
                odds_b: oddsB,
              },
              { onConflict: 'event_id,fighter_a,fighter_b' }
            );

            if (fightError) {
              console.error('❌ Fight insert error:', fightError);
            } else {
              console.log(`🥊 Synced fight: ${fighterA.name} vs ${fighterB.name}`);
            }
          }
        }
      } catch (eventError) {
        console.error('⚠️ Error processing event:', eventError);
      }
    }

    console.log('✅ UFC odds successfully synced to Supabase.');
    return NextResponse.json({
      success: true,
      message: 'Fight odds synced successfully from TheOddsAPI',
    });
  } catch (err) {
    console.error('💥 UFC Sync Error:', err);
    return NextResponse.json({ error: 'Failed to fetch fight odds' }, { status: 500 });
  }
}
