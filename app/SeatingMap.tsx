"use client";

import { useState, useEffect, useRef } from "react";

const VP_W = 400;
const VP_H = 510;

interface Pt { x: number; y: number; }

// ─── Table positions ───────────────────────────────────────────────────────────
// Col 1 x= 48: T1, T4
// Col 2 x=112: T2, T3, T12, T14
// Col 3 x=183: T6, T5, T8,  T15
// Col 4 x=252: T7, T9, T17, T16
// Col 5 x=330: T10(alone), T11, T13
//
// Row A y=176: T1,  T2,  T6,  T7,  T11
// Row B y=224: T4,  T3,  T5,  T9,  T13  ← entrance (right wall)
// Row C y=345: T12, T8,  T17
// Row D y=395: T14, T15, T16
// Solo  y=128: T10  (above Row A, col 5)
//
// Horizontal aisles (verified clear of all circles ±17 px):
//   y=105  above T10        (T10 top=111)
//   y=152  T10→RowA         (T10 bot=145 < 152 < RowA top=159)
//   y=200  RowA→RowB        (RowA bot=193 < 200 < RowB top=207)
//   y=285  RowB→RowC        (RowB bot=241 < 285 < RowC top=328)
//   y=370  RowC→RowD        (RowC bot=362 < 370 < RowD top=378)
const TABLE_POS: Record<number, Pt> = {
   1: { x:  48, y: 176 },
   2: { x: 112, y: 176 },
   3: { x: 112, y: 224 },
   4: { x:  48, y: 224 },
   5: { x: 183, y: 224 },
   6: { x: 183, y: 176 },
   7: { x: 252, y: 176 },
   8: { x: 183, y: 345 },
   9: { x: 252, y: 224 },
  10: { x: 330, y: 128 },
  11: { x: 330, y: 176 },
  12: { x: 112, y: 345 },
  13: { x: 330, y: 224 },
  14: { x: 112, y: 395 },
  15: { x: 183, y: 395 },
  16: { x: 252, y: 395 },
  17: { x: 252, y: 345 },
};

// Entrance: RIGHT wall, Row B level
const ENTRANCE: Pt = { x: 392, y: 224 };
// Right vertical aisle — clear of T10/T11/T13 (right edge 330+17=347)
const AISLE_X = 358;

function getHAisle(n: number): number {
  const y = TABLE_POS[n]?.y ?? 224;
  if (y <= 128) return 105;  // T10 alone
  if (y <= 176) return 152;  // Row A
  if (y <= 224) return 200;  // Row B
  if (y <= 345) return 285;  // Row C
  return 370;                 // Row D
}

function getWaypoints(tableNum: number): Pt[] {
  const pos = TABLE_POS[tableNum];
  if (!pos) return [];
  const hy = getHAisle(tableNum);
  return [
    ENTRANCE,
    { x: AISLE_X, y: ENTRANCE.y },  // step into right aisle
    { x: AISLE_X, y: hy },           // travel aisle to corridor
    { x: pos.x,   y: hy },           // walk corridor to table column
    pos,                              // arrive at table
  ];
}

// ─── Rounded-corner path ──────────────────────────────────────────────────────
function buildRoundedPath(pts: Pt[], r = 14): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    if (len1 === 0 || len2 === 0) continue;
    const rr  = Math.min(r, len1 / 2, len2 / 2);
    const ux1 = dx1 / len1, uy1 = dy1 / len1;
    const ux2 = dx2 / len2, uy2 = dy2 / len2;
    const a   = { x: curr.x - ux1 * rr, y: curr.y - uy1 * rr };
    const b   = { x: curr.x + ux2 * rr, y: curr.y + uy2 * rr };
    d += ` L ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${curr.x},${curr.y} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  d += ` L ${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}

// ─── Animated route ───────────────────────────────────────────────────────────
function AnimatedPath({ tableNum }: { tableNum: number }) {
  const ref             = useRef<SVGPathElement>(null);
  const [len, setLen]   = useState(3000);
  const [off, setOff]   = useState(3000);
  const [done, setDone] = useState(false);
  const pts = getWaypoints(tableNum);
  const d   = buildRoundedPath(pts);

  useEffect(() => {
    if (!ref.current || !d) return;
    setDone(false);
    const l = ref.current.getTotalLength();
    setLen(l); setOff(l);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setOff(0);
      setTimeout(() => setDone(true), 1700);
    }));
  }, [tableNum, d]);

  if (!d) return null;
  const pid = `rp${tableNum}`;
  return (
    <g>
      <path d={d} fill="none" stroke="white" strokeWidth="12"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" />
      <path d={d} fill="none" stroke="#1a5c28" strokeWidth="8.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      <path ref={ref} id={pid} d={d} fill="none"
        stroke="url(#gRoute)" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={off}
        style={{ transition: off === 0 ? "stroke-dashoffset 1.5s cubic-bezier(0.25,0.46,0.45,0.94)" : "none" }}
      />
      {done && (
        <g>
          <circle r="6" fill="white" opacity="0.9">
            <animateMotion dur="2.2s" repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          </circle>
          <circle r="3.5" fill="url(#gRoute)" opacity="0.95">
            <animateMotion dur="2.2s" repeatCount="indefinite"><mpath href={`#${pid}`} /></animateMotion>
          </circle>
        </g>
      )}
    </g>
  );
}

// ─── Destination pin ──────────────────────────────────────────────────────────
const PR  = 16;
const PCY = -30;
const PIN_D = `M 0,0 C -6,-7 -${PR},-15 -${PR},${PCY} A ${PR},${PR} 0 1 1 ${PR},${PCY} C ${PR},-15 6,-7 0,0 Z`;

function TablePin({ n, pos, selected }: { n: number; pos: Pt; selected: boolean }) {
  if (!selected) {
    return (
      <g>
        <circle cx={pos.x} cy={pos.y} r={17}
          fill="url(#tblNorm)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.12))" }} />
        <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
          fontSize={n >= 10 ? "9" : "10.5"} fontWeight="700" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>{n}</text>
      </g>
    );
  }
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      <ellipse cx={1.5} cy={3} rx={12} ry={4}
        fill="rgba(0,0,0,0.28)" style={{ filter: "blur(3px)" }} />
      <path d={PIN_D} fill="url(#pinRed)" stroke="white" strokeWidth="2.5"
        strokeLinejoin="round" className="pin-glow" />
      <circle cx={0} cy={PCY} r={PR + 6}
        fill="none" stroke="rgba(234,67,53,0.7)" strokeWidth="1.8"
        strokeDasharray="5 4" className="pin-rotate" />
      <circle cx={0} cy={PCY} r={PR * 0.52} fill="white" />
      <text x={0} y={PCY + 0.8} textAnchor="middle" dominantBaseline="middle"
        fontSize={n >= 10 ? "9.5" : "11"} fontWeight="900"
        fill="#c0392b" fontFamily="'Playfair Display', serif"
        style={{ userSelect: "none" }}>{n}</text>
    </g>
  );
}

// ─── SVG map ──────────────────────────────────────────────────────────────────
function SeatingMapSVG({ selectedTable }: { selectedTable: number }) {
  return (
    <>
      <style>{`
        @keyframes pinGlow {
          0%,100% { filter: drop-shadow(0 5px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 6px rgba(234,67,53,0.5)); }
          50%     { filter: drop-shadow(0 5px 10px rgba(0,0,0,0.45)) drop-shadow(0 0 18px rgba(234,67,53,1)); }
        }
        @keyframes pinRotate {
          from { transform: rotate(0deg); } to { transform: rotate(360deg); }
        }
        @keyframes entrancePulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          60%     { opacity: 0;   transform: scale(1.9); }
        }
        .pin-glow   { animation: pinGlow 2s ease-in-out infinite; }
        .pin-rotate { transform-origin: 0px -30px; animation: pinRotate 3s linear infinite; }
        .entr-ring  { transform-origin: center; animation: entrancePulse 1.5s ease-out infinite; }
      `}</style>

      <svg viewBox={`0 0 ${VP_W} ${VP_H}`} width="100%"
        style={{ display: "block", maxHeight: "calc(90vh - 168px)" }}
        aria-label="Wedding hall seating map">

        <defs>
          <linearGradient id="gRoute" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#43e97b" />
            <stop offset="100%" stopColor="#38f9d7" />
          </linearGradient>
          <linearGradient id="pinRed" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%"   stopColor="#ff6b6b" />
            <stop offset="40%"  stopColor="#ea4335" />
            <stop offset="100%" stopColor="#8b0000" />
          </linearGradient>
          <radialGradient id="tblNorm" cx="35%" cy="30%">
            <stop offset="0%"   stopColor="#fffdf0" />
            <stop offset="100%" stopColor="#f5dfa0" />
          </radialGradient>
          <linearGradient id="roomBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fffef8" />
            <stop offset="100%" stopColor="#fef6e0" />
          </linearGradient>
          <linearGradient id="stageGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#3d2206" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
          <linearGradient id="danceGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="rgba(255,252,228,0.95)" />
            <stop offset="100%" stopColor="rgba(253,233,160,0.7)" />
          </linearGradient>
          <radialGradient id="entrDot">
            <stop offset="0%"   stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
        </defs>

        {/* ── Room ─────────────────────────────────────────────────────────── */}
        <rect x="1" y="1" width={VP_W-2} height={VP_H-2} rx="12"
          fill="url(#roomBg)" stroke="rgba(201,168,76,0.35)" strokeWidth="2" />

        {/* Entrance gap — right wall */}
        <rect x={VP_W-3} y={206} width="5" height="36" fill="url(#roomBg)" />

        {/* ── Photographers table — top-left ────────────────────────────────── */}
        <rect x="4" y="5" width="90" height="55" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="49" y="24" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" style={{ userSelect: "none" }}>📸</text>
        <text x="49" y="40" textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>PHOTO</text>
        <text x="49" y="52" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.65)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>GRAPHERS</text>

        {/* ── Stage — top-centre ────────────────────────────────────────────── */}
        <rect x="138" y="5" width="118" height="38" rx="7"
          fill="url(#stageGrad)" stroke="rgba(180,130,30,0.6)" strokeWidth="1.5" />
        <text x="197" y="19" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.97)"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          ♪ STAGE ♪
        </text>
        <text x="197" y="33" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fill="rgba(255,224,120,0.9)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5" style={{ userSelect: "none" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </text>

        {/* ── Band table — top-right ────────────────────────────────────────── */}
        <rect x="300" y="5" width="92" height="55" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="346" y="24" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" style={{ userSelect: "none" }}>🎸</text>
        <text x="346" y="40" textAnchor="middle" dominantBaseline="middle"
          fontSize="7.5" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>BAND</text>
        <text x="346" y="52" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.65)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>TABLE</text>

        {/* ── Dancing floor — below stage ───────────────────────────────────── */}
        <rect x="133" y="48" width="128" height="45" rx="6"
          fill="url(#danceGrad)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          strokeDasharray="7,4" />
        <text x="197" y="71" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5" style={{ userSelect: "none" }}>
          ✦ DANCING FLOOR ✦
        </text>

        {/* ── Settee — left side, below Row B ──────────────────────────────── */}
        <rect x="4" y="250" width="84" height="62" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <polygon points="46,260 53,267 46,274 39,267"
          fill="none" stroke="rgba(201,168,76,0.65)" strokeWidth="1.2" />
        <polygon points="46,263 50,267 46,271 42,267"
          fill="rgba(201,168,76,0.22)" stroke="rgba(201,168,76,0.5)" strokeWidth="0.8" />
        <text x="46" y="287" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>SETTEE</text>
        <text x="46" y="301" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.8" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>COUPLE&apos;S SEAT</text>

        {/* ── Bar — left side, below settee ────────────────────────────────── */}
        <rect x="4" y="320" width="84" height="72" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="46" y="344" textAnchor="middle" dominantBaseline="middle"
          fontSize="11" style={{ userSelect: "none" }}>🍹</text>
        <text x="46" y="364" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>BAR</text>
        <text x="46" y="379" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.8" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>LOUNGE</text>

        {/* ── Poruwa — bottom-right ─────────────────────────────────────────── */}
        <rect x="278" y="378" width="114" height="118" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <polygon points="335,390 344,399 335,408 326,399"
          fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.2" />
        <polygon points="335,393 341,399 335,405 329,399"
          fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.55)" strokeWidth="0.8" />
        <text x="335" y="425" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>PORUWA</text>
        <text x="335" y="441" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fill="rgba(139,105,20,0.65)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>CEREMONY</text>
        <text x="335" y="455" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>✦ ✦ ✦</text>

        {/* ── Route (drawn before tables so pin sits on top) ─────────────────── */}
        <AnimatedPath tableNum={selectedTable} />

        {/* ── Tables ───────────────────────────────────────────────────────── */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return <TablePin key={n} n={n} pos={pos} selected={n === selectedTable} />;
        })}

        {/* ── Entrance dot — right wall ─────────────────────────────────────── */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={16}
          fill="rgba(52,168,83,0.28)" className="entr-ring" />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={9.5} fill="white"
          style={{ filter: "drop-shadow(0 1px 5px rgba(0,0,0,0.25))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={7.5} fill="url(#entrDot)"
          style={{ filter: "drop-shadow(0 0 6px rgba(52,168,83,0.8))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={2.8} fill="white" />
        <text x={ENTRANCE.x - 14} y={ENTRANCE.y - 16}
          textAnchor="end" dominantBaseline="middle"
          fontSize="6" fontWeight="800" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          YOU ARE HERE
        </text>
        <line x1={ENTRANCE.x - 13} y1={ENTRANCE.y - 10}
              x2={ENTRANCE.x - 9}  y2={ENTRANCE.y - 4}
          stroke="#15803d" strokeWidth="0.9" strokeOpacity="0.5" />
        <text x={ENTRANCE.x - 14} y={ENTRANCE.y + 14}
          textAnchor="end" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          ↙ ENTRY
        </text>
      </svg>
    </>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function SeatingMapModal({ tableNumber, onClose }: { tableNumber: number; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 350); };

  return (
    <div onClick={close} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(15,10,3,0.8)", backdropFilter: "blur(8px)",
               opacity: visible ? 1 : 0, transition: "opacity 0.35s ease" }}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-lg mx-0 sm:mx-4"
        style={{ maxHeight: "96vh", overflow: "hidden",
                 transform: visible ? "translateY(0)" : "translateY(72px)",
                 opacity: visible ? 1 : 0,
                 transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease" }}>
        <div className="rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          style={{ background: "linear-gradient(160deg,#fffef8 0%,#fef3cc 55%,#fff9e8 100%)",
                   border: "1.5px solid rgba(201,168,76,0.5)",
                   boxShadow: "0 24px 64px rgba(80,50,0,0.4)", maxHeight: "96vh" }}>

          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>

          <div className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.22)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#c9a84c,#8b6914)", boxShadow: "0 4px 14px rgba(180,140,40,0.45)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-stone-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px" }}>
                  Table {tableNumber} — Your Seat
                </p>
                <p style={{ fontFamily: "'Lato', sans-serif", fontSize: "12px", color: "rgba(180,130,30,0.8)" }}>
                  Follow the green route ✦
                </p>
              </div>
            </div>
            <button onClick={close} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.18)", color: "#8b6914" }} aria-label="Close map">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-hidden px-2 py-2 min-h-0">
            <SeatingMapSVG selectedTable={tableNumber} />
          </div>

          <div className="px-4 py-3 shrink-0 flex items-center justify-center gap-5 flex-wrap"
            style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="flex items-center gap-1.5">
              <div style={{ width: "22px", height: "5px",
                background: "linear-gradient(90deg,#43e97b,#38f9d7)",
                borderRadius: "3px", boxShadow: "0 0 6px rgba(67,233,123,0.5)" }} />
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "11px", color: "#5c3d0e" }}>Your Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="14" viewBox="-12 -48 24 52">
                <path d={PIN_D} fill="#ea4335" stroke="white" strokeWidth="2.5" />
                <circle cx="0" cy={PCY} r={PR * 0.52} fill="white" />
              </svg>
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "11px", color: "#5c3d0e" }}>Your Table</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: "11px", height: "11px", borderRadius: "50%",
                backgroundColor: "#16a34a", border: "2px solid white",
                boxShadow: "0 0 5px rgba(52,168,83,0.6)" }} />
              <span style={{ fontFamily: "'Lato',sans-serif", fontSize: "11px", color: "#5c3d0e" }}>Entrance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
