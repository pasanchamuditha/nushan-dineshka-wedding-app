import { NextResponse } from "next/server";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVSpucQuZf6cBABS90Q9dLvFZh0P7W-6y52cEPYONpF3w52ydiJqIn9u-9SwMga8DJ/exec";

export async function GET() {
  try {
    const res  = await fetch(SCRIPT_URL, { redirect: "follow", cache: "no-store" });
    const text = await res.text();

    if (text.trimStart().startsWith("<")) {
      return NextResponse.json({ success: false, photos: [], error: "Apps Script auth error" });
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to load photos";
    return NextResponse.json({ success: false, photos: [], error: msg });
  }
}
