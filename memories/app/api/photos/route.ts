import { NextResponse } from "next/server";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVSpucQuZf6cBABS90Q9dLvFZh0P7W-6y52cEPYONpF3w52ydiJqIn9u-9SwMga8DJ/exec";

export async function GET() {
  try {
    const res  = await fetch(SCRIPT_URL, { next: { revalidate: 0 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load photos";
    return NextResponse.json({ success: false, photos: [], error: msg });
  }
}
