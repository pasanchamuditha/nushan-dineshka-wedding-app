"use client";

import { useState, useEffect, useRef } from "react";

const VP_W = 400;
const VP_H = 510;

interface Pt { x: number; y: number; }

// ─── Table positions ──────────────────────────────────────────────────────────
// Col L (x=65):  T16,T17,T13,T11,T10   (top → bottom, left wall)
// Col CL(x=135): T09,T07
// Col C (x=195): T08,T15
// Col CR(x=250): T05,T06
// Col R (x=300): T12,T14,T03,T02,T01   (right side)
// Col FR(x=340): T04                   (far right, next to T03)
//
// Row A y= 85:  T16, T08, T12
// Row B y=150:  T17, T15, T14
// Row C y=210:  T09, T05, T03, T04
// Row D y=270:  T13, T07, T06
// Row E y=325:  T11, T02
// Row F y=380:  T10, T01
//
// Aisles (clear of all table circles ±17):
//   y= 55 (above row A)      row A top  = 68
//   y=118 (A→B)              97 < 118 < 133
//   y=180 (B→C)             167 < 180 < 193
//   y=240 (C→D)             227 < 240 < 253
//   y=300 (D→E)             287 < 300 < 308
//   y=356 (E→F = entrance)  342 < 356 < 363
const TABLE_POS: Record<number, Pt> = {
  16: { x:  65, y:  85 },
   8: { x: 195, y:  85 },
  12: { x: 300, y:  85 },
  17: { x:  65, y: 150 },
  15: { x: 195, y: 150 },
  14: { x: 300, y: 150 },
   9: { x: 135, y: 210 },
   5: { x: 250, y: 210 },
   3: { x: 300, y: 210 },
   4: { x: 340, y: 210 },
  13: { x:  65, y: 270 },
   7: { x: 135, y: 270 },
   6: { x: 250, y: 270 },
  11: { x:  65, y: 325 },
   2: { x: 300, y: 325 },
  10: { x:  65, y: 380 },
   1: { x: 300, y: 380 },
};

// Entrance: LEFT wall, between rows E and F
const ENTRANCE: Pt = { x: 8, y: 356 };
const AISLE_X      = 30; // left vertical aisle (clear: tables start at x=65-17=48)

function getHAisle(n: number): number {
  const y = TABLE_POS[n]?.y ?? 356;
  if (y <=  85) return  55;
  if (y <= 150) return 118;
  if (y <= 210) return 180;
  if (y <= 270) return 240;
  if (y <= 325) return 300;
  return 356; // entrance level — row F tables
}

function getWaypoints(tableNum: number): Pt[] {
  const pos = TABLE_POS[tableNum];
  if (!pos) return [];
  const hy = getHAisle(tableNum);
  // Row F shares y-level with entrance — go directly right
  if (hy === ENTRANCE.y) {
    return [ENTRANCE, { x: pos.x, y: ENTRANCE.y }, pos];
  }
  return [
    ENTRANCE,
    { x: AISLE_X, y: ENTRANCE.y }, // step into left aisle
    { x: AISLE_X, y: hy },          // travel aisle to corridor
    { x: pos.x,   y: hy },          // walk corridor to table column
    pos,
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
  const last = pts[pts.length - 1];
  d += ` L ${last.x},${last.y}`;
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

        {/* Entrance gap in LEFT wall */}
        <rect x="0" y="338" width="5" height="36" fill="url(#roomBg)" />

        {/* ── Poruwa — top-left (near T16, T17) ───────────────────────────── */}
        <rect x="4" y="5" width="80" height="58" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <polygon points="44,13 52,21 44,29 36,21"
          fill="none" stroke="rgba(201,168,76,0.7)" strokeWidth="1.2" />
        <polygon points="44,16 49,21 44,26 39,21"
          fill="rgba(201,168,76,0.25)" stroke="rgba(201,168,76,0.55)" strokeWidth="0.8" />
        <text x="44" y="40" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>PORUWA</text>
        <text x="44" y="54" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>CEREMONY</text>

        {/* ── Bar — top-right (beside T12 & T14) ──────────────────────────── */}
        <rect x="319" y="5" width="73" height="160" rx="7"
          fill="rgba(255,248,220,0.6)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="356" y="42" textAnchor="middle" dominantBaseline="middle"
          fontSize="13" style={{ userSelect: "none" }}>🍹</text>
        <text x="356" y="62" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>BAR</text>
        <text x="356" y="77" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>LOUNGE</text>
        <line x1="325" y1="92" x2="388" y2="92"
          stroke="rgba(201,168,76,0.35)" strokeWidth="0.8" strokeDasharray="4,3" />
        <text x="356" y="115" textAnchor="middle" dominantBaseline="middle"
          fontSize="10" style={{ userSelect: "none" }}>📷</text>
        <text x="356" y="134" textAnchor="middle" dominantBaseline="middle"
          fontSize="7.5" fontWeight="700" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>PHOTO</text>
        <text x="356" y="148" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.5" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>BOOTH</text>

        {/* ── Settee — right wall (vertical strip) ─────────────────────────── */}
        <rect x="364" y="193" width="28" height="152" rx="6"
          fill="rgba(255,248,220,0.55)" stroke="rgba(201,168,76,0.55)" strokeWidth="1.5"
          strokeDasharray="5,3" />
        <text x="378" y="269"
          textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif"
          transform="rotate(90 378 269)"
          style={{ userSelect: "none" }}>SETTEE</text>

        {/* ── Bottom zones ─────────────────────────────────────────────────── */}
        {/* Band — bottom-left */}
        <rect x="4" y="403" width="105" height="98" rx="7"
          fill="rgba(255,248,220,0.55)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="56" y="436" textAnchor="middle" dominantBaseline="middle"
          fontSize="11" style={{ userSelect: "none" }}>🎸</text>
        <text x="56" y="456" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>BAND</text>
        <text x="56" y="470" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.8" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>STAGE AREA</text>

        {/* Dancing floor — bottom-centre */}
        <rect x="115" y="403" width="170" height="42" rx="6"
          fill="url(#danceGrad)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          strokeDasharray="7,4" />
        <text x="200" y="424" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          ✦ DANCING FLOOR ✦
        </text>

        {/* Stage — bottom-centre below dancing */}
        <rect x="115" y="450" width="170" height="50" rx="7"
          fill="url(#stageGrad)" stroke="rgba(180,130,30,0.6)" strokeWidth="1.5" />
        <text x="200" y="468" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.97)"
          fontFamily="'Lato', sans-serif" letterSpacing="2" style={{ userSelect: "none" }}>
          ♪ STAGE ♪
        </text>
        <text x="200" y="484" textAnchor="middle" dominantBaseline="middle"
          fontSize="6.5" fill="rgba(255,224,120,0.9)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5" style={{ userSelect: "none" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </text>

        {/* Gift / cake table — bottom-right */}
        <rect x="288" y="403" width="104" height="98" rx="7"
          fill="rgba(255,248,220,0.55)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5"
          strokeDasharray="6,3" />
        <text x="340" y="436" textAnchor="middle" dominantBaseline="middle"
          fontSize="13" style={{ userSelect: "none" }}>🎂</text>
        <text x="340" y="458" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="800" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>CAKE</text>
        <text x="340" y="472" textAnchor="middle" dominantBaseline="middle"
          fontSize="5.8" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>& GIFTS</text>

        {/* ── Route ────────────────────────────────────────────────────────── */}
        <AnimatedPath tableNum={selectedTable} />

        {/* ── Tables ───────────────────────────────────────────────────────── */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return <TablePin key={n} n={n} pos={pos} selected={n === selectedTable} />;
        })}

        {/* ── Entrance dot — left wall ─────────────────────────────────────── */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={16}
          fill="rgba(52,168,83,0.28)" className="entr-ring" />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={9.5} fill="white"
          style={{ filter: "drop-shadow(0 1px 5px rgba(0,0,0,0.25))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={7.5} fill="url(#entrDot)"
          style={{ filter: "drop-shadow(0 0 6px rgba(52,168,83,0.8))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={2.8} fill="white" />
        <text x={ENTRANCE.x + 44} y={ENTRANCE.y - 14}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="800" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          YOU ARE HERE
        </text>
        <line x1={ENTRANCE.x + 20} y1={ENTRANCE.y - 9}
              x2={ENTRANCE.x + 10} y2={ENTRANCE.y - 3}
          stroke="#15803d" strokeWidth="0.9" strokeOpacity="0.5" />
        <text x={ENTRANCE.x + 20} y={ENTRANCE.y + 15}
          textAnchor="start" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>
          ↗ ENTRY 1
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
