"use client";

import { useState, useEffect, useRef } from "react";

const VP_W = 400;
const VP_H = 510;

interface Pt { x: number; y: number; }

// ─── Table positions ──────────────────────────────────────────────────────────
const TABLE_POS: Record<number, Pt> = {
  16: { x: 322, y:  72 },
   1: { x:  72, y: 132 },  2: { x: 152, y: 132 },  3: { x: 232, y: 132 },  4: { x: 312, y: 132 },
   5: { x:  72, y: 204 },  6: { x: 152, y: 204 },  7: { x: 232, y: 204 },  8: { x: 312, y: 204 },
   9: { x:  72, y: 276 }, 10: { x: 152, y: 276 }, 11: { x: 232, y: 276 }, 12: { x: 312, y: 276 },
  13: { x: 152, y: 348 }, 14: { x: 232, y: 348 }, 15: { x: 312, y: 348 },
  17: { x: 312, y: 420 },
};

// Entrance: right wall at Row-B level
const ENTRANCE: Pt = { x: 390, y: 204 };
const AISLE_X      = 354; // right vertical aisle, clear of all tables

// ─── Horizontal aisles (corridors BETWEEN rows — no table circles) ─────────────
// Row A tables y=132 ±17 → edge at 115/149
// Row B tables y=204 ±17 → edge at 187/221
// Row C tables y=276 ±17 → edge at 259/293
// Row D tables y=348 ±17 → edge at 331/365
// T17        y=420 ±17 → edge at 403/437
// T16        y= 72 ±17 → edge at  55/ 89
function getHAisle(n: number): number {
  if (n === 16)                  return 102;   // above Row A (Row A top=115)
  if (n >= 1 && n <= 4)          return 102;   // approach Row A from above
  if (n >= 5 && n <= 7)          return 168;   // between Row A (bottom=149) and Row B (top=187)
  if (n === 8)                   return 204;   // same row as entrance — direct right aisle
  if (n >= 9  && n <= 12)        return 238;   // between Row B (bottom=221) and Row C (top=259)
  if (n >= 13 && n <= 15)        return 310;   // between Row C (bottom=293) and Row D (top=331)
  if (n === 17)                  return 383;   // between Row D (bottom=365) and T17 (top=403)
  return 168;
}

// ─── Build waypoints (path goes through aisles, never through tables) ─────────
function getWaypoints(tableNum: number): Pt[] {
  const pos = TABLE_POS[tableNum];
  if (!pos) return [];

  if (tableNum === 8) {
    // Table 8 is directly right of the aisle at the same row — no detour needed
    return [ENTRANCE, { x: AISLE_X, y: 204 }, pos];
  }

  const hy = getHAisle(tableNum);
  return [
    ENTRANCE,
    { x: AISLE_X, y: ENTRANCE.y }, // enter right aisle
    { x: AISLE_X, y: hy },          // travel right aisle to horizontal corridor
    { x: pos.x,   y: hy },          // walk along corridor to table's column
    pos,                             // arrive at table
  ];
}

// ─── Rounded-corner SVG path (Google Maps smooth turns) ───────────────────────
function buildRoundedPath(pts: Pt[], r = 14): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const rr  = Math.min(r, len1 / 2, len2 / 2);
    const ux1 = dx1 / len1, uy1 = dy1 / len1;
    const ux2 = dx2 / len2, uy2 = dy2 / len2;
    const a   = { x: curr.x - ux1 * rr, y: curr.y - uy1 * rr };
    const b   = { x: curr.x + ux2 * rr, y: curr.y + uy2 * rr };
    d += ` L ${a.x.toFixed(1)},${a.y.toFixed(1)} Q ${curr.x},${curr.y} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x},${last.y}`;
  return d;
}

// ─── Animated route (Google Maps style) ──────────────────────────────────────
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
      {/* White shadow underline */}
      <path d={d} fill="none" stroke="white" strokeWidth="12"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.8" />
      {/* Dark green border for depth */}
      <path d={d} fill="none" stroke="#1a5c28" strokeWidth="8.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
      {/* Main bright green route */}
      <path ref={ref} id={pid} d={d} fill="none"
        stroke="url(#gRoute)" strokeWidth="6"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={len} strokeDashoffset={off}
        style={{
          transition: off === 0
            ? "stroke-dashoffset 1.5s cubic-bezier(0.25,0.46,0.45,0.94)"
            : "none",
        }}
      />
      {/* Moving white dot (direction indicator) */}
      {done && (
        <g>
          <circle r="6" fill="white" opacity="0.9">
            <animateMotion dur="2.2s" repeatCount="indefinite">
              <mpath href={`#${pid}`} />
            </animateMotion>
          </circle>
          <circle r="3.5" fill="url(#gRoute)" opacity="0.95">
            <animateMotion dur="2.2s" repeatCount="indefinite">
              <mpath href={`#${pid}`} />
            </animateMotion>
          </circle>
        </g>
      )}
    </g>
  );
}

// ─── Google-Maps destination pin ──────────────────────────────────────────────
// Tip at (0,0), circle head centred at (0, PCY)
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
      {/* Expanding pulse rings at pin base */}
      <circle cx={0} cy={0} r={8} fill="rgba(201,168,76,0.4)" className="pin-r2" />
      <circle cx={0} cy={0} r={16} fill="none"
        stroke="rgba(201,168,76,0.7)" strokeWidth="2" className="pin-r1" />
      <circle cx={0} cy={0} r={26} fill="none"
        stroke="rgba(201,168,76,0.35)" strokeWidth="1.5" className="pin-r0" />

      {/* Ground shadow */}
      <ellipse cx={1.5} cy={3} rx={11} ry={4}
        fill="rgba(0,0,0,0.25)" style={{ filter: "blur(3px)" }} />

      {/* Pin body */}
      <path d={PIN_D}
        fill="url(#pinFill)"
        stroke="white" strokeWidth="2.5" strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 5px 12px rgba(0,0,0,0.4))" }} />

      {/* White circle inside pin head (Google Maps style) */}
      <circle cx={0} cy={PCY} r={PR * 0.38} fill="white" opacity="0.95" />

      {/* Table number */}
      <text x={0} y={PCY + 0.5} textAnchor="middle" dominantBaseline="middle"
        fontSize={n >= 10 ? "8.5" : "10"} fontWeight="900"
        fill="url(#pinFill)" fontFamily="'Playfair Display', serif"
        style={{ userSelect: "none" }}>{n}</text>
    </g>
  );
}

// ─── Full SVG map ─────────────────────────────────────────────────────────────
function SeatingMapSVG({ selectedTable }: { selectedTable: number }) {
  return (
    <>
      <style>{`
        @keyframes pinExpand {
          0%   { transform: scale(1);   opacity: 0.85; }
          80%  { transform: scale(2.4); opacity: 0;    }
          100% { transform: scale(2.4); opacity: 0;    }
        }
        @keyframes entrancePulse {
          0%,100% { opacity: 0.5; transform: scale(1);   }
          60%     { opacity: 0;   transform: scale(1.9); }
        }
        .pin-r0 { transform-origin: center; animation: pinExpand 1.8s 0.0s ease-out infinite; }
        .pin-r1 { transform-origin: center; animation: pinExpand 1.8s 0.4s ease-out infinite; }
        .pin-r2 { transform-origin: center; animation: pinExpand 1.8s 0.8s ease-out infinite; }
        .entr-ring { transform-origin: center; animation: entrancePulse 1.5s ease-out infinite; }
      `}</style>

      <svg viewBox={`0 0 ${VP_W} ${VP_H}`} width="100%"
        style={{ display: "block", maxHeight: "calc(90vh - 168px)" }}
        aria-label="Wedding hall seating map">

        <defs>
          <linearGradient id="gRoute" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#43e97b" />
            <stop offset="100%" stopColor="#38f9d7" />
          </linearGradient>
          <linearGradient id="pinFill" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="35%"  stopColor="#d4a017" />
            <stop offset="100%" stopColor="#7c4a00" />
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
            <stop offset="100%" stopColor="rgba(253,233,160,0.7)"  />
          </linearGradient>
          <radialGradient id="entrDot">
            <stop offset="0%"   stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
        </defs>

        {/* Room */}
        <rect x="1" y="1" width={VP_W-2} height={VP_H-2} rx="12"
          fill="url(#roomBg)" stroke="rgba(201,168,76,0.35)" strokeWidth="2" />

        {/* Entrance gap */}
        <rect x={VP_W-2} y={186} width="4" height="38" fill="url(#roomBg)" />
        <text x={VP_W-9} y={205} textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          ↙ ENTRANCE
        </text>

        {/* Stage */}
        <rect x="100" y="6" width="170" height="36" rx="7"
          fill="url(#stageGrad)" stroke="rgba(180,130,30,0.6)" strokeWidth="1.5" />
        <text x="185" y="20" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.97)"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          ♪ BAND STAGE ♪
        </text>
        <text x="185" y="34" textAnchor="middle" dominantBaseline="middle"
          fontSize="6.5" fill="rgba(255,224,120,0.9)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5" style={{ userSelect: "none" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </text>

        {/* Dancing Floor */}
        <rect x="50" y="48" width="240" height="38" rx="6"
          fill="url(#danceGrad)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" strokeDasharray="7,4" />
        <text x="170" y="67" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          ✦ DANCING FLOOR ✦
        </text>

        {/* Zone labels */}
        <text x="5" y="67" textAnchor="start" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>PORUWA</text>

        <text x="5" y="272" textAnchor="start" dominantBaseline="middle"
          fontSize="5.8" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>SETTIE</text>
        <text x="5" y="281" textAnchor="start" dominantBaseline="middle"
          fontSize="5.8" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>BACK</text>

        <rect x="4" y="404" width="60" height="30" rx="5"
          fill="rgba(255,248,220,0.7)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2" />
        <text x="34" y="416" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>HEAD</text>
        <text x="34" y="426" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>TABLE</text>

        <text x={VP_W-6} y="420" textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>🍹 BAR</text>

        <rect x="95" y="468" width="200" height="30" rx="6"
          fill="rgba(255,248,220,0.75)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" />
        <text x="195" y="483" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          🍽 BUFFET
        </text>

        {/* Route drawn BEFORE tables so pin sits on top */}
        <AnimatedPath tableNum={selectedTable} />

        {/* Tables */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return <TablePin key={n} n={n} pos={pos} selected={n === selectedTable} />;
        })}

        {/* Entrance — Google Maps blue-dot style */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={16}
          fill="rgba(52,168,83,0.28)" className="entr-ring" />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={9.5} fill="white"
          style={{ filter: "drop-shadow(0 1px 5px rgba(0,0,0,0.25))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={7.5}
          fill="url(#entrDot)"
          style={{ filter: "drop-shadow(0 0 6px rgba(52,168,83,0.8))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={2.8} fill="white" />
        <text x={ENTRANCE.x - 28} y={ENTRANCE.y - 16}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="800" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          YOU ARE HERE
        </text>
        <line x1={ENTRANCE.x - 18} y1={ENTRANCE.y - 11}
              x2={ENTRANCE.x - 9}  y2={ENTRANCE.y - 4}
          stroke="#15803d" strokeWidth="0.9" strokeOpacity="0.5" />
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
                <path d={PIN_D} fill="#d4a017" stroke="white" strokeWidth="2.5" />
                <circle cx="0" cy={PCY} r={PR * 0.38} fill="white" />
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
