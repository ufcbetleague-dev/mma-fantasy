import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    console.log("🔄 Syncing UFC events...");

    // Fetch all MMA events from The Odds API
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No events found from Odds API.",
      });
    }

    // Helper to clean event names
    const normalize = (str: string) =>
      str.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

    // Transform data for your ufc_events table
    const eventRows = data.map((event: any) => ({
      name: event.title || event.sport_title || "UFC Event",
      event_date: event.commence_time
        ? new Date(event.commence_time).toISOString()
        : new Date().toISOString(),
      sport: "MMA",
    }));

    // Deduplicate by event name + date
    const uniqueEvents = Array.from(
      new Map(
        eventRows.map((e) => [
          `${normalize(e.name)}_${e.event_date.slice(0, 10)}`,
          e,
        ])
      ).values()
    );

    // Insert or update events into Supabase
    const { error: insertError } = await supabase
      .from("ufc_events")
      .upsert(uniqueEvents, { onConflict: "name,event_date" });

    if (insertError) throw insertError;

    console.log(`✅ Synced ${uniqueEvents.length} UFC events successfully`);

    return NextResponse.json({
      success: true,
      count: uniqueEvents.length,
    });
  } catch (err: any) {
    console.error("❌ Error syncing UFC events:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

