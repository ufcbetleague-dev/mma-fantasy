import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Public FightOdds.io endpoint for upcoming UFC events
const FIGHTODDS_URL = 'https://fightodds.io/api/events';

export async function GET() {
  try {
    const res = await fetch(FIGHTODDS_URL);
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

    const events = await res.json();

    // Filter for UFC events only
    const ufcEvents = events.filter((ev: any) => ev.organization === 'UFC');

    console.log(`✅ Found ${ufcEvents.length} UFC events`);

    for (const ev of ufcEvents) {
      const { error } = await supabase
        .from('events')
        .upsert({
          name: ev.name || ev.title,
          event_date: ev.date,
          is_active: true,
        })
        .select();

      if (error) console.error('❌ Error inserting event:', error);
    }

    return NextResponse.json({ success: true, count: ufcEvents.length });
  } catch (err: any) {
    console.error('❌ UFC Sync Error:', err.message);
    return NextResponse.json({ error: 'Failed to fetch UFC data' }, { status: 500 });
  }
}
