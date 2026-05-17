"use client";

import { useState, useEffect, useRef } from "react";

const VP_W = 400;
const VP_H = 510;

interface Pt { x: number; y: number; }

const TABLE_POS: Record<number, Pt> = {
  16: { x: 322, y:  72 },
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
  17: { x: 312, y: 420 },
};

const ENTRANCE: Pt  = { x: 390, y: 204 };
const AISLE_X       = 353;

function makePath(n: number): string {
  const p = TABLE_POS[n];
  if (!p) return "";
  return `M ${ENTRANCE.x},${ENTRANCE.y} L ${AISLE_X},${ENTRANCE.y} L ${AISLE_X},${p.y} L ${p.x},${p.y}`;
}

// ─── Google-Maps-style route ──────────────────────────────────────────────────
function AnimatedPath({ tableNum }: { tableNum: number }) {
  const ref               = useRef<SVGPathElement>(null);
  const [len, setLen]     = useState(3000);
  const [off, setOff]     = useState(3000);
  const [done, setDone]   = useState(false);
  const d = makePath(tableNum);

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
  const pathId = `rp-${tableNum}`;

  return (
    <g>
      {/* White border underline */}
      <path d={d} fill="none" stroke="white" strokeWidth="11"
        strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.75" />

      {/* Main route line — draws itself, then stays solid */}
      <path
        ref={ref}
        id={pathId}
        d={d} fill="none"
        stroke="url(#gRoute)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={off}
        style={{
          transition: off === 0 ? "stroke-dashoffset 1.5s cubic-bezier(0.25,0.46,0.45,0.94)" : "none",
          filter: "drop-shadow(0 0 5px rgba(52,168,83,0.55))",
        }}
      />

      {/* Moving dot along the route (like Google Maps direction indicator) */}
      {done && (
        <circle r="5" fill="white" opacity="0.9"
          style={{ filter: "drop-shadow(0 0 3px rgba(52,168,83,0.8))" }}>
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      )}
    </g>
  );
}

// ─── Google-Maps-style location pin ──────────────────────────────────────────
// Pin tip at (0,0), circle body above
const PR  = 15;   // pin circle radius
const PCY = -28;  // circle centre y (above tip)
// Smooth teardrop path
const PIN_PATH = `M 0,0 C -6,-6 -${PR},-14 -${PR},${PCY} A ${PR},${PR} 0 1 1 ${PR},${PCY} C ${PR},-14 6,-6 0,0 Z`;

function TablePin({ n, pos, selected }: { n: number; pos: Pt; selected: boolean }) {
  if (!selected) {
    return (
      <g>
        <circle cx={pos.x} cy={pos.y} r={17}
          fill="url(#tblNorm)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5"
          style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.1))" }} />
        <text x={pos.x} y={pos.y + 0.5} textAnchor="middle" dominantBaseline="middle"
          fontSize={n >= 10 ? "9" : "10.5"} fontWeight="700" fill="#7a5010"
          fontFamily="'Playfair Display', serif" style={{ userSelect: "none" }}>{n}</text>
      </g>
    );
  }

  // Selected: Google Maps pin
  return (
    <g transform={`translate(${pos.x},${pos.y})`}>
      {/* Pulsing ring at pin base — like Google Maps destination pulse */}
      <circle cx={0} cy={0} r={22} fill="none"
        stroke="rgba(201,168,76,0.55)" strokeWidth="2" className="pin-ring-1" />
      <circle cx={0} cy={0} r={13} fill="rgba(201,168,76,0.3)" className="pin-ring-2" />

      {/* Ground shadow ellipse */}
      <ellipse cx={1} cy={2} rx={10} ry={4}
        fill="rgba(0,0,0,0.22)" style={{ filter: "blur(3px)" }} />

      {/* Pin body */}
      <path d={PIN_PATH}
        fill="url(#pinFill)"
        stroke="white"
        strokeWidth="2.2"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.35)) drop-shadow(0 0 6px rgba(201,168,76,0.4))" }}
      />

      {/* Table number inside pin circle */}
      <text x={0} y={PCY + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={n >= 10 ? "10" : "11.5"} fontWeight="800" fill="white"
        fontFamily="'Playfair Display', serif"
        style={{ userSelect: "none", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
        {n}
      </text>
    </g>
  );
}

// ─── Full SVG map ─────────────────────────────────────────────────────────────
function SeatingMapSVG({ selectedTable }: { selectedTable: number }) {
  return (
    <>
      <style>{`
        @keyframes pinRingPulse {
          0%   { opacity: 0.9; transform: scale(1);    }
          60%  { opacity: 0.0; transform: scale(1.7);  }
          100% { opacity: 0.0; transform: scale(1.7);  }
        }
        @keyframes entrancePulse {
          0%,100% { r: 13; opacity: 0.35; }
          50%     { r: 19; opacity: 0.08; }
        }
        .pin-ring-1 {
          transform-origin: center;
          animation: pinRingPulse 1.5s 0.0s ease-out infinite;
        }
        .pin-ring-2 {
          transform-origin: center;
          animation: pinRingPulse 1.5s 0.4s ease-out infinite;
        }
        .entrance-ring {
          animation: entrancePulse 1.4s ease-in-out infinite;
        }
      `}</style>

      <svg viewBox={`0 0 ${VP_W} ${VP_H}`} width="100%"
        style={{ display: "block", maxHeight: "calc(90vh - 168px)" }}
        aria-label="Wedding hall seating map">

        <defs>
          {/* Google-Maps-style green route gradient */}
          <linearGradient id="gRoute" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#34A853" />
            <stop offset="100%" stopColor="#1a7a35" />
          </linearGradient>

          {/* Pin fill gradient: gold top → darker gold/amber bottom */}
          <linearGradient id="pinFill" x1="0" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="40%"  stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#92530a" />
          </linearGradient>

          {/* Normal table fill */}
          <radialGradient id="tblNorm" cx="35%" cy="30%">
            <stop offset="0%"   stopColor="#fffdf0" />
            <stop offset="100%" stopColor="#f5dfa0" />
          </radialGradient>

          {/* Room background */}
          <linearGradient id="roomBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fffef8" />
            <stop offset="100%" stopColor="#fef6e0" />
          </linearGradient>
          <linearGradient id="stageGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#3d2206" />
            <stop offset="100%" stopColor="#c9a84c" />
          </linearGradient>
          <linearGradient id="danceGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="rgba(255,252,230,0.95)" />
            <stop offset="100%" stopColor="rgba(253,233,160,0.7)"  />
          </linearGradient>

          {/* Entrance dot gradient */}
          <radialGradient id="entrDot" cx="40%" cy="35%">
            <stop offset="0%"   stopColor="#86efac" />
            <stop offset="100%" stopColor="#16a34a" />
          </radialGradient>
        </defs>

        {/* ── Room ── */}
        <rect x="1" y="1" width={VP_W-2} height={VP_H-2} rx="12"
          fill="url(#roomBg)" stroke="rgba(201,168,76,0.35)" strokeWidth="2" />

        {/* ── Entrance door gap + label ── */}
        <rect x={VP_W-2} y={186} width="4" height="38" fill="url(#roomBg)" />
        <text x={VP_W-9} y={205} textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="#15803d"
          fontFamily="'Lato', sans-serif" letterSpacing="0.4"
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
        <rect x="50" y="48" width="240" height="38" rx="6"
          fill="url(#danceGrad)" stroke="rgba(201,168,76,0.5)" strokeWidth="1.5" strokeDasharray="7,4" />
        <text x="170" y="67" textAnchor="middle" dominantBaseline="middle"
          fontSize="8.5" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2"
          style={{ userSelect: "none" }}>
          ✦ DANCING FLOOR ✦
        </text>

        {/* ── Zone labels ── */}
        {/* Poruwa */}
        <text x="5" y="67" textAnchor="start" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>PORUWA</text>
        {/* Settie Back */}
        <text x="5" y="271" textAnchor="start" dominantBaseline="middle"
          fontSize="5.8" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>SETTIE</text>
        <text x="5" y="281" textAnchor="start" dominantBaseline="middle"
          fontSize="5.8" fontWeight="700" fill="rgba(139,105,20,0.5)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>BACK</text>
        {/* Head Table */}
        <rect x="4" y="404" width="60" height="30" rx="5"
          fill="rgba(255,248,220,0.7)" stroke="rgba(201,168,76,0.4)" strokeWidth="1.2" />
        <text x="34" y="416" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>HEAD</text>
        <text x="34" y="426" textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>TABLE</text>
        {/* Bar */}
        <text x={VP_W-6} y="420" textAnchor="end" dominantBaseline="middle"
          fontSize="6.5" fontWeight="700" fill="rgba(139,105,20,0.6)"
          fontFamily="'Lato', sans-serif" style={{ userSelect: "none" }}>🍹 BAR</text>
        {/* Buffet */}
        <rect x="95" y="468" width="200" height="30" rx="6"
          fill="rgba(255,248,220,0.75)" stroke="rgba(201,168,76,0.45)" strokeWidth="1.5" />
        <text x="195" y="483" textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fontWeight="700" fill="#8b6914"
          fontFamily="'Lato', sans-serif" letterSpacing="2"
          style={{ userSelect: "none" }}>🍽 BUFFET</text>

        {/* ── Route (drawn before tables so pin sits on top) ── */}
        <AnimatedPath tableNum={selectedTable} />

        {/* ── Tables ── */}
        {(Object.entries(TABLE_POS) as [string, Pt][]).map(([ns, pos]) => {
          const n = +ns;
          return <TablePin key={n} n={n} pos={pos} selected={n === selectedTable} />;
        })}

        {/* ── "You Are Here" entrance dot (Google Maps blue-dot style) ── */}
        {/* Outer pulse ring */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={16}
          fill="rgba(52,168,83,0.25)" className="entrance-ring" />
        {/* White border */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={9}
          fill="white"
          style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.2))" }} />
        {/* Green fill */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={7}
          fill="url(#entrDot)"
          style={{ filter: "drop-shadow(0 0 5px rgba(52,168,83,0.7))" }} />
        {/* Centre dot */}
        <circle cx={ENTRANCE.x} cy={ENTRANCE.y} r={2.5} fill="white" />

        {/* Label */}
        <text x={ENTRANCE.x - 28} y={ENTRANCE.y - 15}
          textAnchor="middle" dominantBaseline="middle"
          fontSize="6" fontWeight="800" fill="#15803d"
          fontFamily="'Lato', sans-serif" letterSpacing="0.4"
          style={{ userSelect: "none" }}>
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
      style={{
        background: "rgba(15,10,3,0.78)", backdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0, transition: "opacity 0.35s ease",
      }}>
      <div onClick={e => e.stopPropagation()} className="w-full sm:max-w-lg mx-0 sm:mx-4"
        style={{
          maxHeight: "96vh", overflow: "hidden",
          transform: visible ? "translateY(0)" : "translateY(72px)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.4s cubic-bezier(0.32,0.72,0,1), opacity 0.35s ease",
        }}>
        <div className="rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          style={{
            background: "linear-gradient(160deg,#fffef8 0%,#fef3cc 55%,#fff9e8 100%)",
            border: "1.5px solid rgba(201,168,76,0.5)",
            boxShadow: "0 24px 64px rgba(80,50,0,0.4)",
            maxHeight: "96vh",
          }}>

          {/* Handle */}
          <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>

          {/* Header */}
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
            <button onClick={close}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(201,168,76,0.18)", color: "#8b6914" }}
              aria-label="Close map">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
              </svg>
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 overflow-hidden px-2 py-2 min-h-0">
            <SeatingMapSVG selectedTable={tableNumber} />
          </div>

          {/* Legend */}
          <div className="px-4 py-3 shrink-0 flex items-center justify-center gap-5 flex-wrap"
            style={{ borderTop: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="flex items-center gap-1.5">
              <div style={{ width:"22px", height:"5px", background:"linear-gradient(90deg,#34A853,#1a7a35)", borderRadius:"3px", boxShadow:"0 0 6px rgba(52,168,83,0.5)" }} />
              <span style={{ fontFamily:"'Lato',sans-serif", fontSize:"11px", color:"#5c3d0e" }}>Your Route</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="12" height="16" viewBox="0 0 24 32">
                <path d="M 12,32 C 6,-6 -3,0 -3,-10 A 15,15 0 1 1 27,-10 C 27,0 18,-6 12,32 Z"
                  fill="url(#pinFill2)" stroke="white" strokeWidth="2" />
                <defs>
                  <linearGradient id="pinFill2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fde68a"/>
                    <stop offset="100%" stopColor="#92530a"/>
                  </linearGradient>
                </defs>
              </svg>
              <span style={{ fontFamily:"'Lato',sans-serif", fontSize:"11px", color:"#5c3d0e" }}>Your Table</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width:"11px", height:"11px", borderRadius:"50%", background:"url(#entrDot)", backgroundColor:"#34A853", border:"2px solid white", boxShadow:"0 0 5px rgba(52,168,83,0.6)" }} />
              <span style={{ fontFamily:"'Lato',sans-serif", fontSize:"11px", color:"#5c3d0e" }}>Entrance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
