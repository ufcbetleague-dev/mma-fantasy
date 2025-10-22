import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    console.log("🔄 Syncing fights...");

    // Fetch all MMA fight data from Odds API
    const response = await fetch(
      "https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey=" +
        process.env.ODDS_API_KEY
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ No fight data found");
      return NextResponse.json({ success: false, message: "No fight data found" });
    }

    // Get all UFC events from Supabase (to match fights to events)
    const { data: events, error: eventError } = await supabase
      .from("ufc_events")
      .select("id, name");

    if (eventError) throw eventError;

    // Helper to normalize event names for matching
    const normalize = (str: string) =>
      str?.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

    const fights: any[] = [];

    // Loop through each event/fight item from API
    data.forEach((item: any) => {
      const eventName = item.sport_title || item.sport_key || "MMA Event";

      // Try to match this fight's event to one in Supabase
      const matchedEvent = events.find(
        (e) => normalize(e.name) === normalize(eventName)
      );

      const event_id = matchedEvent ? matchedEvent.id : null;

      if (!item.bookmakers?.length) return; // skip if no odds
      const bookmaker = item.bookmakers[0];
      const markets = bookmaker.markets || [];
      if (!markets.length) return;

      const outcomes = markets[0].outcomes || [];
      if (outcomes.length < 2) return; // must have 2 fighters

      const fighter1 = outcomes[0];
      const fighter2 = outcomes[1];

      // Skip fights that aren’t linked to a valid event
      if (!event_id) return;

      fights.push({
        event_id,
        fighter1_name: fighter1.name,
        fighter2_name: fighter2.name,
        fighter1_odds: fighter1.price,
        fighter2_odds: fighter2.price,
      });
    });

    // Remove duplicates (same event + fighters)
    const uniqueFights = Array.from(
      new Map(
        fights.map((f) => [
          `${f.event_id}-${f.fighter1_name}-${f.fighter2_name}`,
          f,
        ])
      ).values()
    );

    if (uniqueFights.length === 0) {
      console.warn("⚠️ No fights to insert");
      return NextResponse.json({ success: false, message: "No fights to insert" });
    }

    // Insert or update fights in Supabase
    const { error: insertError } = await supabase
      .from("fights")
      .upsert(uniqueFights, {
        onConflict: "event_id,fighter1_name,fighter2_name",
      });

    if (insertError) throw insertError;

    console.log(`✅ Synced ${uniqueFights.length} fights successfully`);

    return NextResponse.json({
      success: true,
      count: uniqueFights.length,
    });
  } catch (err: any) {
    console.error("❌ Error syncing fights:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
      status: 500,
    });
  }
}
