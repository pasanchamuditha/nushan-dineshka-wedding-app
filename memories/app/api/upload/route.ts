import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwVSpucQuZf6cBABS90Q9dLvFZh0P7W-6y52cEPYONpF3w52ydiJqIn9u-9SwMga8DJ/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res  = await fetch(SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
