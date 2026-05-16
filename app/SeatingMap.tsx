"use client";

import { useState, useEffect, useRef } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const VP_W = 380;
const VP_H = 488;
const R = 20; // table circle radius

interface Pt { x: number; y: number; }

// ─── Table Positions (SVG coordinate space) ───────────────────────────────────
// Layout mirrors the hand-drawn sketch:
//  Stage (top center) | T16 left, T17 right flanking stage
//  Dance floor below stage
//  Row 1: T1–T4 | Row 2: T5–T8 | Row 3: T9–T12 | Row 4: T13–T15
//  Entrance on the RIGHT side
const TABLE_POS: Record<number, Pt> = {
  16: { x: 40,  y: 33  },
  17: { x: 340, y: 33  },
  1:  { x: 50,  y: 160 },
  2:  { x: 136, y: 160 },
  3:  { x: 224, y: 160 },
  4:  { x: 310, y: 160 },
  5:  { x: 50,  y: 240 },
  6:  { x: 136, y: 240 },
  7:  { x: 224, y: 240 },
  8:  { x: 310, y: 240 },
  9:  { x: 50,  y: 320 },
  10: { x: 136, y: 320 },
  11: { x: 224, y: 320 },
  12: { x: 310, y: 320 },
  13: { x: 100, y: 400 },
  14: { x: 190, y: 400 },
  15: { x: 280, y: 400 },
};

const ENTRANCE: Pt = { x: 372, y: 455 };
const RIGHT_AISLE_X = 372;

// Horizontal aisle Y coords (corridors guests walk along)
function getRowAisle(n: number): number {
  if (n === 16 || n === 17) return 112;
  if (n >= 1 && n <= 4)     return 132;
  if (n >= 5 && n <= 8)     return 208;
  if (n >= 9 && n <= 12)    return 285;
  return 364; // 13–15
}

// Build SVG path: entrance → up right aisle → along row aisle → to table
function makePath(tableNum: number): string {
  const pos = TABLE_POS[tableNum];
  if (!pos) return "";
  const ry = getRowAisle(tableNum);
  return [
    `M ${ENTRANCE.x},${ENTRANCE.y}`,
    `L ${RIGHT_AISLE_X},${ry}`,
    `L ${pos.x},${ry}`,
    `L ${pos.x},${pos.y}`,
  ].join(" ");
}

// ─── Animated draw path ───────────────────────────────────────────────────────
function AnimatedPath({ tableNum }: { tableNum: number }) {
  const ref = useRef<SVGPathElement>(null);
  const [len, setLen]         = useState(2000);
  const [offset, setOffset]   = useState(2000);
  const d = makePath(tableNum);

  useEffect(() => {
    if (!ref.current) return;
    const l = ref.current.getTotalLength();
    setLen(l);
    setOffset(l);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setOffset(0))
    );
  }, [tableNum]);

  if (!d) return null;
  return (
    <path
      ref={ref}
      d={d}
      fill="none"
      stroke="#22c55e"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={len}
      strokeDashoffset={offset}
      style={{
        transition: offset === 0
          ? "stroke-dashoffset 1.6s cubic-bezier(0.25,0.46,0.45,0.94)"
          : "none",
        filter: "drop-shadow(0 0 5px rgba(34,197,94,0.7)) drop-shadow(0 0 10px rgba(34,197,94,0.35))",
      }}
    />
  );
}

// ─── Table circle ─────────────────────────────────────────────────────────────
function TableCircle({ n, pos, selected }: { n: number; pos: Pt; selected: boolean }) {
  return (
    <g>
      {selected && (
        <>
          <circle cx={pos.x} cy={pos.y} r={R + 14} fill="none"
            stroke="#22c55e" strokeWidth="1.5" className="map-ring-1" />
          <circle cx={pos.x} cy={pos.y} r={R + 7} fill="none"
            stroke="#22c55e" strokeWidth="2" className="map-ring-2" />
        </>
      )}
      <circle
        cx={pos.x} cy={pos.y} r={R}
        fill={selected ? "url(#mapSelGrad)" : "url(#mapTableGrad)"}
        stroke={selected ? "#22c55e" : "rgba(201,168,76,0.55)"}
        strokeWidth={selected ? 2.5 : 1.5}
        style={{
          filter: selected
            ? "drop-shadow(0 0 9px rgba(34,197,94,0.6))"
            : "drop-shadow(0 1px 3px rgba(0,0,0,0.12))",
        }}
      />
      <text
        x={pos.x} y={pos.y + 0.5}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={n >= 10 ? "9.5" : "11"}
        fontWeight="700"
        fill={selected ? "#fff" : "#6b4c12"}
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
        @keyframes mapRingPulse {
          0%   { opacity: 0.75; }
          50%  { opacity: 0.12; }
          100% { opacity: 0.75; }
        }
        @keyframes mapEntrancePulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.08; }
        }
        .map-ring-1 { animation: mapRingPulse 1.4s 0.0s ease-in-out infinite; }
        .map-ring-2 { animation: mapRingPulse 1.4s 0.45s ease-in-out infinite; }
        .map-entrance-pulse { animation: mapEntrancePulse 1.3s ease-in-out infinite; }
      `}</style>

      <svg
        viewBox={`0 0 ${VP_W} ${VP_H}`}
        width="100%"
        style={{ display: "block", maxHeight: "calc(90vh - 170px)" }}
        aria-label="Wedding hall seating map"
      >
        <defs>
          <linearGradient id="mapRoomBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffdf5" />
            <stop offset="100%" stopColor="#fef8e8" />
          </linearGradient>
          <linearGradient id="mapStageGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5c3d0e" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
          <linearGradient id="mapTableGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fffbef" />
            <stop offset="100%" stopColor="#fde9aa" />
          </linearGradient>
          <linearGradient id="mapSelGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
        </defs>

        {/* ── Room background ── */}
        <rect x="1" y="1" width={VP_W - 2} height={VP_H - 2}
          rx="10" fill="url(#mapRoomBg)"
          stroke="rgba(201,168,76,0.3)" strokeWidth="2"
        />

        {/* ── Stage ── */}
        <rect x="112" y="6" width="156" height="48" rx="7"
          fill="url(#mapStageGrad)"
          stroke="rgba(180,140,40,0.5)" strokeWidth="1.5"
        />
        <text x="190" y="24" textAnchor="middle" dominantBaseline="middle"
          fontSize="9.5" fontWeight="700" fill="rgba(255,255,255,0.95)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.5"
          style={{ userSelect: "none" }}>
          ♪ BAND STAGE ♪
        </text>
        <text x="190" y="42" textAnchor="middle" dominantBaseline="middle"
          fontSize="7" fill="rgba(255,228,140,0.85)"
          fontFamily="'Lato', sans-serif" letterSpacing="1.2"
          style={{ userSelect: "none" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </text>

        {/* ── Dance floor ── */}
        <rect x="62" y="58" width="256" height="52" rx="7"
          fill="rgba(255,247,220,0.65)"
          stroke="rgba(201,168,76,0.4)" strokeWidth="1.5"
          strokeDasharray="6,4"
        />
        <text x="190" y="84" textAnchor="middle" dominantBaseline="middle"
          fontSize="9" fontWeight="600" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="1.8"
          style={{ userSelect: "none" }}>
          ✦ DANCE FLOOR ✦
        </text>

        {/* ── Row labels ── */}
        {[
          { y: 160, label: "ROW A" },
          { y: 240, label: "ROW B" },
          { y: 320, label: "ROW C" },
          { y: 400, label: "ROW D" },
        ].map(({ y, label }) => (
          <text key={label} x="8" y={y + 1}
            textAnchor="start" dominantBaseline="middle"
            fontSize="6" fill="rgba(139,105,20,0.45)"
            fontFamily="'Lato', sans-serif" letterSpacing="0.5"
            style={{ userSelect: "none" }}>
            {label}
          </text>
        ))}

        {/* ── Animated route ── */}
        <AnimatedPath tableNum={selectedTable} />

        {/* ── Tables ── */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return (
            <TableCircle key={n} n={n} pos={pos} selected={n === selectedTable} />
          );
        })}

        {/* ── Entrance door gap in right wall ── */}
        <rect x={VP_W - 3} y={440} width="4" height="32"
          fill="url(#mapRoomBg)"
        />
        {/* Arrow pointing inward */}
        <text x={VP_W - 16} y={456}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="10" fontWeight="900" fill="#15803d"
          style={{ userSelect: "none" }}>
          ←
        </text>

        {/* ── "You Are Here" dot ── */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={11}
          fill="#22c55e" className="map-entrance-pulse"
        />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={6} fill="#22c55e" />
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={3} fill="white" />

        {/* Label */}
        <text x={ENTRANCE.x - 32} y={ENTRANCE.y - 14}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" letterSpacing="0.4"
          style={{ userSelect: "none" }}>
          YOU ARE HERE
        </text>
        <line
          x1={ENTRANCE.x - 32} y1={ENTRANCE.y - 9}
          x2={ENTRANCE.x - 10} y2={ENTRANCE.y - 3}
          stroke="#15803d" strokeWidth="0.8" strokeOpacity="0.6"
        />
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

  const close = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{
        background: "rgba(20,15,5,0.72)",
        backdropFilter: "blur(6px)",
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
          transform: visible ? "translateY(0)" : "translateY(64px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease",
        }}
      >
        <div
          className="rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(160deg,#fffdf0 0%,#fef3cd 55%,#fff8e7 100%)",
            border: "1.5px solid rgba(201,168,76,0.45)",
            maxHeight: "96vh",
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>

          {/* Header */}
          <div
            className="flex items-center justify-between px-5 pt-3 pb-3 shrink-0"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#8b6914)",
                  boxShadow: "0 3px 10px rgba(180,140,40,0.35)",
                }}
              >
                {/* Map pin icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                </svg>
              </div>
              <div>
                <p
                  className="font-bold text-stone-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px" }}
                >
                  Table {tableNumber} — Your Seat
                </p>
                <p
                  className="text-amber-600/70"
                  style={{ fontFamily: "'Lato', sans-serif", fontSize: "12px" }}
                >
                  Follow the green path ✦
                </p>
              </div>
            </div>
            <button
              onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.15)", color: "#8b6914" }}
              aria-label="Close map"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
                width: "18px", height: "3px", background: "#22c55e",
                borderRadius: "2px", boxShadow: "0 0 5px rgba(34,197,94,0.6)",
              }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#5c3d0e" }}>
                Your Route
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{
                width: "13px", height: "13px", borderRadius: "50%",
                background: "linear-gradient(135deg,#4ade80,#15803d)",
                boxShadow: "0 0 5px rgba(34,197,94,0.5)",
              }} />
              <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#5c3d0e" }}>
                Your Table
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{
                width: "10px", height: "10px", borderRadius: "50%",
                background: "#22c55e",
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
