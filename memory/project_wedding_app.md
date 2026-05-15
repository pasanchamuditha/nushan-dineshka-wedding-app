---
name: Wedding Seating App
description: Next.js 14 wedding seating lookup app built for a wedding on 17 May 2026 with 15 tables and 137 guests
type: project
---

Wedding seating lookup app built in Next.js 14 + Tailwind CSS + Fuse.js.

**Why:** Guest needs to be deployed before tomorrow's wedding (17 May 2026).

**How to apply:** Keep changes lightweight and fast-deployable. No backend needed — all data is in frontend state.

Key details:
- Excel file: `tables sheet .xlsx` in project root — column-based layout (Table1-Table9 in first section, Table10-Table17 in second)
- Pre-parsed data embedded in `lib/seatingData.ts` — 15 tables (Table16/17 were empty after filtering "Hope" placeholders)
- Drag-and-drop Excel re-upload supported via `lib/parseExcel.ts`
- Couple names shown in hero: "Nushan & Dineshka" — **verify with user if correct**
- Wedding date in UI: 17 May 2026
- Uses Node.js 20 (`.nvmrc` set); Node 16 will fail
- Deploy: static export (`output: "export"` in next.config.mjs) → push to GitHub → import to Vercel
