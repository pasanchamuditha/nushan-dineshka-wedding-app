import { NextRequest, NextResponse } from "next/server";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-Wlsr9ttU_KWEuHDIKWj_Q8SWle0X3Zye5ZQHKws2yOmvQTzku1FDhyOLqde4FqGs/exec";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(SCRIPT_URL, {
      method:   "POST",
      redirect: "follow",
      headers:  { "Content-Type": "text/plain" },
      body:     JSON.stringify({ action: "vote", ...body }),
    });

    const text = await res.text();

    if (text.trimStart().startsWith("<")) {
      return NextResponse.json(
        { success: false, error: "Apps Script auth error" },
        { status: 502 }
      );
    }

    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Vote failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
