import { NextResponse } from "next/server";

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function GET() {
  if (!SCRIPT_URL) {
    return NextResponse.json({ success: false, photos: [], error: "APPS_SCRIPT_URL not configured" });
  }
  try {
    const res  = await fetch(SCRIPT_URL, { next: { revalidate: 0 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load photos";
    return NextResponse.json({ success: false, photos: [], error: msg });
  }
}
