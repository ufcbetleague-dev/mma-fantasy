import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    console.log("🔄 Syncing UFC events...");

    // Fetch all events from the API
    const response = await fetch(
      "https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey=" + process.env.ODDS_API_KEY
    );
    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ No UFC events found from API");
      return NextResponse.json({ success: false, message: "No UFC events found" });
    }

    // Deduplicate by event title
    const uniqueEventsMap = new Map();
    data.forEach((item: any) => {
      const eventName = item.sport_title || "MMA Event";
      const eventDate = item.commence_time;
      const eventId = item.id;

      if (!uniqueEventsMap.has(eventName)) {
        uniqueEventsMap.set(eventName, {
          id: eventId,
          name: eventName,
          event_date: eventDate,
        });
      }
    });

    const uniqueEvents = Array.from(uniqueEventsMap.values());

    // Insert or update events in Supabase
    const { error: insertError } = await supabase
      .from("ufc_events")
      .upsert(uniqueEvents, { onConflict: "id" });

    if (insertError) throw insertError;

    console.log(`✅ Synced ${uniqueEvents.length} UFC events successfully`);

    return NextResponse.json({
      success: true,
      count: uniqueEvents.length,
    });
  } catch (err: any) {
    console.error("❌ Error syncing UFC events:", err);
    return NextResponse.json({
      success: false,
      error: err.message,
      status: 500,
    });
  }
}

