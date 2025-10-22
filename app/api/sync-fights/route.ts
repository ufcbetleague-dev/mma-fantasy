import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    console.log("🔄 Syncing UFC fights...");

    // 1️⃣ Fetch UFC events
    const { data: events, error: eventError } = await supabase
      .from("ufc_events")
      .select("id, name, event_date");

    if (eventError) throw eventError;

    // 2️⃣ Fetch from The Odds API
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
    );
    const fightsData = await oddsResponse.json();

    const fightRows: any[] = [];

    // 3️⃣ Match fights to events by name (more reliable)
    for (const event of fightsData) {
      const apiEventName = event.sport_title || event.title || "MMA";
      const matchedEvent = events.find((e) =>
        e.name.toLowerCase().includes(apiEventName.toLowerCase().split(" ")[0])
      );

      if (!matchedEvent) {
        console.log(`⚠️ No match for event: ${apiEventName}`);
        continue;
      }

      // 4️⃣ Extract fight info
      if (event.bookmakers?.length) {
        const bookmaker = event.bookmakers[0];
        const market = bookmaker.markets?.[0];
        const outcomes = market?.outcomes || [];

        if (outcomes.length === 2) {
          const fighter1 = outcomes[0];
          const fighter2 = outcomes[1];

          fightRows.push({
            event_id: matchedEvent.id,
            fighter1_name: fighter1.name,
            fighter2_name: fighter2.name,
            fighter1_odds: fighter1.price,
            fighter2_odds: fighter2.price,
            winner: null,
          });
        }
      }
    }

    // 5️⃣ Deduplicate properly before upserting
    const seen = new Set();
    const uniqueFights = fightRows.filter((fight) => {
      const key = `${fight.event_id}-${fight.fighter1_name}-${fight.fighter2_name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`🧩 Deduplicated ${fightRows.length} → ${uniqueFights.length} fights`);

    // 6️⃣ Upsert into Supabase
    const { error: insertError } = await supabase
      .from("fights")
      .upsert(uniqueFights, {
        onConflict: "event_id,fighter1_name,fighter2_name",
        ignoreDuplicates: true,
      });

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      inserted: uniqueFights.length,
    });
  } catch (err: any) {
    console.error("❌ Error syncing fights:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
