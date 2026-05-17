"use client";

import { useState, useEffect, useRef } from "react";

// ─── Viewport ─────────────────────────────────────────────────────────────────
const VP_W = 400;
const VP_H = 510;
const R    = 20;   // table circle radius

interface Pt { x: number; y: number; }

// ─── Table Positions ──────────────────────────────────────────────────────────
// From updated floor plan:
//   Band Stage (top centre)
//   Dancing Floor (left-centre) | Table16 (right of dancing floor)
//   Row A: T1–T4
//   Row B: T5–T8          ← Entrance is on the RIGHT of this row
//   Row C: T9–T12         (Settie Back label on left)
//   Row D: T13–T15
//   Head Table (bottom left) | T17 (right area) | Bar (far right)
//   Buffet (bottom centre)
const TABLE_POS: Record<number, Pt> = {
  16: { x: 322, y:  72 },  // right of Dancing Floor
   1: { x:  72, y: 132 },
   2: { x: 152, y: 132 },
   3: { x: 232, y: 132 },
   4: { x: 312, y: 132 },
   5: { x:  72, y: 204 },
   6: { x: 152, y: 204 },
   7: { x: 232, y: 204 },
   8: { x: 312, y: 204 },
   9: { x:  72, y: 276 },
  10: { x: 152, y: 276 },
  11: { x: 232, y: 276 },
  12: { x: 312, y: 276 },
  13: { x: 152, y: 348 },
  14: { x: 232, y: 348 },
  15: { x: 312, y: 348 },
  17: { x: 312, y: 420 },  // Head Table area
};

// Entrance: right side wall at Row B level
const ENTRANCE: Pt   = { x: 390, y: 204 };
const RIGHT_AISLE_X  = 352;

// Google-Maps-style route: Entrance → right-aisle → table-row → table
function makePath(tableNum: number): string {
  const pos = TABLE_POS[tableNum];
  if (!pos) return "";
  return [
    `M ${ENTRANCE.x},${ENTRANCE.y}`,
    `L ${RIGHT_AISLE_X},${ENTRANCE.y}`,
    `L ${RIGHT_AISLE_X},${pos.y}`,
    `L ${pos.x},${pos.y}`,
  ].join(" ");
}

// ─── Animated route path (Google-Maps style) ──────────────────────────────────
function AnimatedPath({ tableNum }: { tableNum: number }) {
  const ref  = useRef<SVGPathElement>(null);
  const [len,     setLen]     = useState(3000);
  const [offset,  setOffset]  = useState(3000);
  const [flowing, setFlowing] = useState(false);
  const d = makePath(tableNum);

  useEffect(() => {
    if (!ref.current) return;
    setFlowing(false);
    const l = ref.current.getTotalLength();
    setLen(l); setOffset(l);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setOffset(0);
        setTimeout(() => setFlowing(true), 1700);
      })
    );
  }, [tableNum]);

  if (!d) return null;
  return (
    <g>
      {/* White shadow underline — always drawn */}
      <path d={d} fill="none" stroke="white" strokeWidth="9"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6" />

      {/* Main animated draw stroke */}
      <path
        ref={ref}
        d={d} fill="none"
        stroke="url(#routeGrad)"
        strokeWidth="5.5"
        strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray={flowing ? "10 14" : len}
        strokeDashoffset={flowing ? undefined : offset}
        style={{
          transition: flowing ? "none" : offset === 0
            ? "stroke-dashoffset 1.6s cubic-bezier(0.25,0.46,0.45,0.94)"
            : "none",
          animation: flowing ? "routeFlow 0.7s linear infinite" : "none",
          filter: "drop-shadow(0 0 4px rgba(34,197,94,0.65)) drop-shadow(0 0 10px rgba(34,197,94,0.3))",
        }}
      />
    </g>
  );
}

// ─── Table circle ─────────────────────────────────────────────────────────────
function TableCircle({ n, pos, selected }: { n: number; pos: Pt; selected: boolean }) {
  return (
    <g>
      {selected && (
        <>
          {/* Outer gold pulse ring */}
          <circle cx={pos.x} cy={pos.y} r={R + 16} fill="none"
            stroke="url(#ringGold)" strokeWidth="1.5" className="sel-ring-1" />
          {/* Middle green ring */}
          <circle cx={pos.x} cy={pos.y} r={R + 8} fill="none"
            stroke="#22c55e" strokeWidth="2" className="sel-ring-2" />
          {/* Inner gold-green glow disc */}
          <circle cx={pos.x} cy={pos.y} r={R + 2}
            fill="none" stroke="url(#ringGoldGreen)" strokeWidth="3"
            className="sel-ring-3" />
        </>
      )}
      <circle
        cx={pos.x} cy={pos.y} r={R}
        fill={selected ? "url(#tableSelFill)" : "url(#tableNormFill)"}
        stroke={selected ? "url(#tableSelStroke)" : "rgba(201,168,76,0.5)"}
        strokeWidth={selected ? 2 : 1.5}
        style={{
          filter: selected
            ? "drop-shadow(0 0 8px rgba(201,168,76,0.7)) drop-shadow(0 0 16px rgba(34,197,94,0.45))"
            : "drop-shadow(0 1px 4px rgba(0,0,0,0.1))",
        }}
      />
      <text
        x={pos.x} y={pos.y + 0.5}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={n >= 10 ? "9" : "10.5"}
        fontWeight="700"
        fill={selected ? "#fff" : "#7a5010"}
        fontFamily="'Playfair Display', serif"
        style={{ userSelect: "none" }}
      >{n}</text>
    </g>
  );
}

// ─── Full SVG map ─────────────────────────────────────────────────────────────
function SeatingMapSVG({ selectedTable }: { selectedTable: number }) {
  return (
    <>
      <style>{`
        @keyframes selRingPulse {
          0%,100% { opacity: 0.9; transform-origin: center; transform: scale(1); }
          50%      { opacity: 0.2; transform: scale(1.04); }
        }
        @keyframes routeFlow {
          to { stroke-dashoffset: -24; }
        }
        @keyframes entrancePulse {
          0%,100% { opacity: 0.4; }
          50%      { opacity: 0.08; }
        }
        .sel-ring-1 { animation: selRingPulse 1.6s 0.00s ease-in-out infinite; }
        .sel-ring-2 { animation: selRingPulse 1.6s 0.35s ease-in-out infinite; }
        .sel-ring-3 { animation: selRingPulse 1.6s 0.70s ease-in-out infinite; }
        .entrance-pulse { animation: entrancePulse 1.3s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox={`0 0 ${VP_W} ${VP_H}`}
        width="100%"
        style={{ display: "block", maxHeight: "calc(90vh - 168px)" }}
        aria-label="Wedding hall seating map"
      >
        <defs>
          {/* Route gradient: bright green → emerald */}
          <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#4ade80" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
          {/* Table normal fill */}
          <radialGradient id="tableNormFill" cx="35%" cy="35%">
            <stop offset="0%"   stopColor="#fffdf0" />
            <stop offset="100%" stopColor="#f5dfa0" />
          </radialGradient>
          {/* Table selected fill — gold to green */}
          <linearGradient id="tableSelFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#c9a84c" />
            <stop offset="55%"  stopColor="#8b6914" />
            <stop offset="100%" stopColor="#166534" />
          </linearGradient>
          <linearGradient id="tableSelStroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
          {/* Ring gradients */}
          <linearGradient id="ringGold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
          <linearGradient id="ringGoldGreen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          {/* Room bg */}
          <linearGradient id="roomBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fffef8" />
            <stop offset="100%" stopColor="#fef6e0" />
          </linearGradient>
          {/* Stage gradient */}
          <linearGradient id="stageGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#4a3008" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
          {/* Dance floor */}
          <linearGradient id="danceGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="rgba(255,248,220,0.9)" />
            <stop offset="100%" stopColor="rgba(253,233,160,0.6)" />
          </linearGradient>
        </defs>

        {/* ── Room background ── */}
        <rect x="1" y="1" width={VP_W - 2} height={VP_H - 2}
          rx="12" fill="url(#roomBg)"
          stroke="rgba(201,168,76,0.35)" strokeWidth="2" />

        {/* ── Entrance door (right wall, Row B level) ── */}
        <rect x={VP_W - 2} y={186} width="4" height="36"
          fill="url(#roomBg)" />
        <text x={VP_W - 8} y={204}
          textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" letterSpacing="0.5"
          style={{ userSelect: "none" }}>
          ↙ ENTRANCE
        </text>

        {/* ── Band Stage ── */}
        <rect x="100" y="6" width="170" height="36" rx="7"
          fill="url(#stageGrad)" stroke="rgba(180,130,30,0.6)" strokeWidth="1.5" />
        <text x="185" y="20" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.97)"
          fontFamily="'Lato', sans-serif" letterSpacing="2"
          style={{ userSelect: "none" }}>
          ♪ BAND STAGE ♪
        </text>
        <text x="185" y="34" textAnchor="middle" dominantBaseline="middle"
          fontSize="6.5" fill="rgba(255,224,120,0.9)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5"
          style={{ userSelect: "none" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </text>

        {/* ── Dancing Floor ── */}
        <rect x="50" y="48" width="238" height="38" rx="6"
          fill="url(#danceGrad)"
          stroke="rgba(201,168,76,0.5)" strokeWidth="1.5"
          strokeDasharray="7,4" />
        <text x="169" y="67" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2"
          style={{ userSelect: "none" }}>
          ✦ DANCING FLOOR ✦
        </text>

        {/* ── Poruwa label (left of dancing floor) ── */}
        <text x="6" y="67" textAnchor="start" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.65)"
          fontFamily="'Lato', sans-serif" letterSpacing="0.5"
          style={{ userSelect: "none" }}>
          PORUWA
        </text>

        {/* ── Settie Back label ── */}
        <text x="6" y="276" textAnchor="start" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" letterSpacing="0.4"
          style={{ userSelect: "none" }}>
          SETTIE
        </text>
        <text x="6" y="285" textAnchor="start" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" letterSpacing="0.4"
          style={{ userSelect: "none" }}>
          BACK
        </text>

        {/* ── Head Table area (bottom left) ── */}
        <rect x="4" y="400" width="62" height="32" rx="5"
          fill="rgba(255,248,220,0.7)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2" />
        <text x="35" y="416" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="0.5"
          style={{ userSelect: "none" }}>
          HEAD
        </text>
        <text x="35" y="426" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="0.5"
          style={{ userSelect: "none" }}>
          TABLE
        </text>

        {/* ── Bar label (bottom right) ── */}
        <text x={VP_W - 6} y="420" textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" letterSpacing="0.8"
          style={{ userSelect: "none" }}>
          🍹 BAR
        </text>

        {/* ── Buffet (bottom center) ── */}
        <rect x="95" y="468" width="200" height="30" rx="6"
          fill="rgba(255,248,220,0.75)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" />
        <text x="195" y="483" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2"
          style={{ userSelect: "none" }}>
          🍽 BUFFET
        </text>

        {/* ── Animated route ── */}
        <AnimatedPath tableNum={selectedTable} />

        {/* ── Tables ── */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return <TableCircle key={n} n={n} pos={pos} selected={n === selectedTable} />;
        })}

        {/* ── "You Are Here" entrance dot ── */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={13}
          fill="#22c55e" className="entrance-pulse" />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={7.5} fill="#22c55e"
          style={{ filter: "drop-shadow(0 0 5px rgba(34,197,94,0.8))" }} />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={3.5} fill="white" />
        <text x={ENTRANCE.x - 30} y={ENTRANCE.y - 16}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="800" fill="#15803d"
          fontFamily="'Lato', sans-serif" letterSpacing="0.5"
          style={{ userSelect: "none" }}>
          YOU ARE HERE
        </text>
        <line
          x1={ENTRANCE.x - 22} y1={ENTRANCE.y - 11}
          x2={ENTRANCE.x - 8}  y2={ENTRANCE.y - 4}
          stroke="#15803d" strokeWidth="1" strokeOpacity="0.55" />
      </svg>
    </>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
export function SeatingMapModal({
  tableNumber,
  onClose,
}: {
  tableNumber: number;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const close = () => { setVisible(false); setTimeout(onClose, 350); };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        background: "rgba(20,15,5,0.75)",
        backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-lg mx-0 sm:mx-4"
        style={{
          maxHeight: "96vh",
          overflow: "hidden",
          transform: visible ? "translateY(0)" : "translateY(72px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease",
        }}
      >
        <div
          className="rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(160deg,#fffef8 0%,#fef3cc 55%,#fff9e8 100%)",
            border: "1.5px solid rgba(201,168,76,0.5)",
            boxShadow: "0 24px 64px rgba(100,70,0,0.35), 0 0 0 1px rgba(201,168,76,0.2)",
            maxHeight: "96vh",
          }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.22)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#8b6914)",
                  boxShadow: "0 4px 14px rgba(180,140,40,0.45)",
                }}
              >
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
                <p className="text-amber-700/70"
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: "12px" }}>
                  Follow the green route ✦
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-70"
              style={{ background: "rgba(201,168,76,0.18)", color: "#8b6914" }}
              aria-label="Close map"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13"/>
                <line x1="13" y1="1" x2="1" y2="13"/>
              </svg>
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 overflow-hidden px-2 py-2 min-h-0">
            <SeatingMapSVG selectedTable={tableNumber} />
          </div>

          {/* Legend */}
          <div
            className="px-4 py-3 shrink-0 flex items-center justify-center gap-5 flex-wrap"
            style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}
          >
            <div className="flex items-center gap-1.5">
              <div style={{
                width: "22px", height: "4px",
                background: "linear-gradient(90deg,#4ade80,#16a34a)",
                borderRadius: "2px",
                boxShadow: "0 0 6px rgba(34,197,94,0.55)",
              }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#5c3d0e" }}>
                Your Route
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{
                width: "14px", height: "14px", borderRadius: "50%",
                background: "linear-gradient(135deg,#c9a84c,#166534)",
                boxShadow: "0 0 6px rgba(34,197,94,0.5), 0 0 3px rgba(201,168,76,0.5)",
              }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#5c3d0e" }}>
                Your Table
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 5px rgba(34,197,94,0.6)",
              }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#5c3d0e" }}>
                Entrance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
