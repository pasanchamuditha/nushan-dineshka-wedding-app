import { NextRequest, NextResponse } from "next/server";

export const config = { api: { bodyParser: { sizeLimit: "120mb" } } };

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw-jOETj7_Qow-lz4rsLvBfowZD1FmzxHfw80iJL29_1g360BAT1kW9QYuTmbRd7Ag/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(body),
    });

    const text = await res.text();

    // Apps Script sometimes returns HTML on auth errors — detect and report clearly
    if (text.trimStart().startsWith("<")) {
      return NextResponse.json(
        { success: false, error: "Apps Script returned HTML — check deployment settings (Execute as: Me, Access: Anyone)" },
        { status: 502 }
      );
    }

    const data = JSON.parse(text);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

