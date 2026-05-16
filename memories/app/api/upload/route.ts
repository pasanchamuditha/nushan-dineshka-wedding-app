import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = process.env.APPS_SCRIPT_URL;

export async function POST(req: NextRequest) {
  if (!SCRIPT_URL) {
    return NextResponse.json({ success: false, error: "APPS_SCRIPT_URL not configured" }, { status: 500 });
  }
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
