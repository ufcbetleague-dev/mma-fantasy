import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Fetch fights from The Odds API and link to UFC events
export async function GET() {
  try {
    console.log("🔄 Syncing UFC fights...");

    // Fetch fights from The Odds API (same sport key as /sync-ufc)
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch fights: ${response.statusText}`);
    }

    const data = await response.json();

    // Fetch events from Supabase (these were created by /sync-ufc)
    const { data: events, error: eventsError } = await supabase
      .from("ufc_events")
      .select("id, name, event_date");

    if (eventsError) throw eventsError;

    // Helper to normalize names for fuzzy matching
    const normalize = (str: string) => {
      return str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    };

    const fightRows: any[] = [];

    // Loop through all fight events from the API
    for (const event of data) {
      const apiEventName = normalize(event.title || event.sport_title || "");

      // Try to find the matching event in Supabase
      let matchedEvent =
        events.find((e) => normalize(e.name) === apiEventName) ||
        events.find((e) => normalize(e.name).includes(apiEventName)) ||
        null;

      // Try matching by "UFC ###" number if names don't align
      if (!matchedEvent) {
        const match = apiEventName.match(/ufc\s?\d+/);
        if (match) {
          matchedEvent = events.find((e) =>
            normalize(e.name).includes(match[0])
          );
        }
      }

      if (!matchedEvent) {
        console.log(`⚠️ No event match for: ${event.title}`);
        continue; // Skip if we can’t match an event
      }

      // Extract fighter and odds info
      const market = event.bookmakers?.[0]?.markets?.[0];
      const outcomes = market?.outcomes || [];
      if (outcomes.length < 2) continue;

      const fight = {
        event_id: matchedEvent.id,
        fighter1_name: outcomes[0].name,
        fighter2_name: outcomes[1].name,
        fighter1_odds: outcomes[0].price,
        fighter2_odds: outcomes[1].price,
        winner: null,
      };

      fightRows.push(fight);
    }

    // Deduplicate by event_id + fighter names
    const uniqueFights = Array.from(
      new Map(
        fightRows.map((f) => [
          `${f.event_id}_${f.fighter1_name}_${f.fighter2_name}`,
          f,
        ])
      ).values()
    );

    if (uniqueFights.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No fights found to sync.",
      });
    }

    // Insert or update fights into Supabase
    const { error: insertError } = await supabase
      .from("fights")
      .upsert(uniqueFights, { onConflict: "event_id,fighter1_name,fighter2_name" });

    if (insertError) throw insertError;

    console.log(`✅ Synced ${uniqueFights.length} fights successfully`);
    return NextResponse.json({
      success: true,
      count: uniqueFights.length,
    });
  } catch (err: any) {
    console.error("❌ Error syncing fights:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
