import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

// Syncs UFC event data and fight odds into Supabase
export async function GET() {
  try {
    console.log("🔄 Starting full data sync...");

    // --- Sync Events ---
    const eventsRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/events`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      },
    });

    if (!eventsRes.ok) {
      throw new Error(`❌ Event sync failed with status ${eventsRes.status}`);
    }

    const events = await eventsRes.json();
    console.log(`✅ Synced ${events.length} events`);

    // --- Sync Odds ---
    const oddsRes = await fetch(
      `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds?regions=us&markets=h2h&apiKey=${process.env.ODDS_API_KEY}`
    );

    if (!oddsRes.ok) {
      throw new Error(`❌ Odds API failed with status ${oddsRes.status}`);
    }

    const odds = await oddsRes.json();
    console.log(`✅ Synced ${odds.length} fights`);

    return NextResponse.json({
      success: true,
      events: events.length,
      fights: odds.length,
    });
  } catch (error) {
    console.error("❌ Sync Error:", error);
    return NextResponse.json({ error: "Failed to sync data" }, { status: 500 });
  }
}
