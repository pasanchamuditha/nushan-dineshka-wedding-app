"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { SEATING_DATA, buildGuestIndex, type GuestRecord } from "@/lib/seatingData";
import { SeatingMapModal } from "./SeatingMap";

// ─── Countdown Clock ──────────────────────────────────────────────────────────
const WEDDING_DATE = new Date("2026-05-18T00:00:00+05:30");

function useCountdown() {
  const calc = () => {
    const diff = WEDDING_DATE.getTime() - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    return {
      days:    Math.floor(diff / 86400000),
      hours:   Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
      done:    false,
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function CountdownClock() {
  const { days, hours, minutes, seconds, done } = useCountdown();
  if (done) return (
    <div className="text-center mt-3 mb-1">
      <span className="text-amber-600 text-sm font-semibold" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.12em" }}>
        ✦ Today is the Day ✦
      </span>
    </div>
  );
  const units = [
    { label: "Days",    value: days },
    { label: "Hours",   value: hours },
    { label: "Minutes", value: minutes },
    { label: "Seconds", value: seconds },
  ];
  return (
    <div className="flex justify-center gap-2 mt-3 mb-1">
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="flex flex-col items-center justify-center rounded-xl px-2.5 py-2 min-w-[54px]"
            style={{ background: "rgba(255,253,240,0.7)", border: "1px solid rgba(201,168,76,0.35)", boxShadow: "0 2px 10px rgba(180,140,40,0.12)" }}
          >
            <span
              className="font-bold tabular-nums leading-none"
              style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.3rem,5vw,1.8rem)", color: "#8b6914", lineHeight: 1.1 }}
            >
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-amber-700/70 uppercase mt-0.5" style={{ fontFamily: "'Lato', sans-serif", fontSize: "9px", letterSpacing: "0.15em" }}>
              {label}
            </span>
          </div>
          {i < 3 && (
            <span className="text-amber-500/80 font-bold text-base pb-3" style={{ lineHeight: 1 }}>:</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Agenda Modal ─────────────────────────────────────────────────────────────
function AgendaModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  const close = () => { setVisible(false); setTimeout(onClose, 350); };

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{
        background: "rgba(20,15,5,0.65)",
        backdropFilter: "blur(6px)",
        transition: "opacity 0.35s",
        opacity: visible ? 1 : 0,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "linear-gradient(160deg,#fffdf0 0%,#fef3cd 60%,#fff8e7 100%)",
          border: "1.5px solid rgba(201,168,76,0.45)",
          boxShadow: "0 24px 60px rgba(120,90,20,0.28), 0 2px 12px rgba(201,168,76,0.18)",
          borderRadius: "28px",
          maxWidth: "360px",
          width: "100%",
          padding: "36px 28px 32px",
          transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s",
          transform: visible ? "translateY(0) scale(1)" : "translateY(40px) scale(0.92)",
          opacity: visible ? 1 : 0,
          position: "relative",
        }}
      >
        {/* Close button */}
        <button
          onClick={close}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          style={{ background: "rgba(201,168,76,0.12)", color: "#8b6914" }}
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
          </svg>
        </button>

        {/* Ornament top */}
        <div className="text-center mb-4">
          <span style={{ fontSize: "28px" }}>💌</span>
          <h3 className="font-bold mt-2" style={{ fontFamily: "'Playfair Display', serif", color: "#5c3d0e", fontSize: "1.35rem", letterSpacing: "0.1em" }}>
            Wedding Agenda
          </h3>
          <div style={{ width: "48px", height: "1.5px", background: "linear-gradient(90deg,transparent,#c9a84c,transparent)", margin: "10px auto 0" }} />
        </div>

        {/* Coming Soon content */}
        <div className="text-center py-6">
          {/* Animated hourglass */}
          <div style={{ fontSize: "48px", marginBottom: "12px", display: "inline-block", animation: "spin 3s linear infinite" }}>⏳</div>
          <p style={{ fontFamily: "'Playfair Display', serif", color: "#7a5318", fontSize: "1.15rem", fontWeight: 600, letterSpacing: "0.06em" }}>
            Coming Soon
          </p>
          <p style={{ fontFamily: "'Lato', sans-serif", color: "#a07840", fontSize: "0.82rem", marginTop: "8px", lineHeight: 1.6, letterSpacing: "0.04em" }}>
            The full wedding agenda will be<br />revealed closer to the big day.
          </p>

          {/* Decorative dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "20px" }}>
            {[0, 0.3, 0.6].map((d, i) => (
              <span key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#c9a84c", opacity: 0.5, display: "inline-block", animation: `pulse 1.6s ${d}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>

        {/* Bottom ornament */}
        <p className="text-center mt-2" style={{ fontFamily: "'Lato', sans-serif", color: "#c9a84c", fontSize: "11px", letterSpacing: "0.25em" }}>
          ✦ NUSHAN &amp; DINESHKA ✦
        </p>
      </div>
    </div>
  );
}

// ─── Envelope Button ──────────────────────────────────────────────────────────
function EnvelopeButton({ onClick }: { onClick: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center mt-4 mb-2">
      <button
        onClick={() => { setOpen(true); onClick(); }}
        aria-label="View wedding agenda"
        className="group flex flex-col items-center gap-1.5 focus:outline-none"
      >
        {/* Envelope SVG */}
        <div
          className="relative transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          style={{ filter: "drop-shadow(0 4px 14px rgba(180,140,40,0.35))" }}
        >
          <svg width="62" height="46" viewBox="0 0 62 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Envelope body */}
            <rect x="1" y="1" width="60" height="44" rx="6" fill="url(#envGrad)" stroke="#c9a84c" strokeWidth="1.5"/>
            {/* Flap */}
            <path d={open ? "M1 1 L31 20 L61 1" : "M1 1 L31 24 L61 1 L61 1 Q55 14 31 26 Q7 14 1 1Z"}
              fill={open ? "none" : "url(#flapGrad)"} stroke="#c9a84c" strokeWidth="1.5" strokeLinejoin="round"
              style={{ transition: "d 0.4s ease" }}
            />
            {/* V fold lines */}
            <path d="M1 46 L31 24 L61 46" stroke="#c9a84c" strokeWidth="1" strokeOpacity="0.5"/>
            {/* Wax seal */}
            <circle cx="31" cy="26" r="7" fill="url(#sealGrad)" stroke="#c9a84c" strokeWidth="1"/>
            <text x="31" y="30" textAnchor="middle" fontSize="8" fill="white" fontFamily="serif">N&amp;D</text>
            <defs>
              <linearGradient id="envGrad" x1="0" y1="0" x2="62" y2="46" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fffdf0"/>
                <stop offset="100%" stopColor="#fef3cd"/>
              </linearGradient>
              <linearGradient id="flapGrad" x1="0" y1="0" x2="62" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#fef3cd"/>
                <stop offset="100%" stopColor="#f5dfa0"/>
              </linearGradient>
              <linearGradient id="sealGrad" x1="24" y1="19" x2="38" y2="33" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#c9a84c"/>
                <stop offset="100%" stopColor="#8b6914"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "10px", letterSpacing: "0.22em", color: "#8b6914", textTransform: "uppercase", fontWeight: 600 }}>
          View Agenda
        </span>
      </button>
    </div>
  );
}

// ─── Floral corner SVG ────────────────────────────────────────────────────────
function FloralCorner({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="85"
      height="75"
      viewBox="0 0 150 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined, opacity: 0.72 }}
      aria-hidden
    >
      <path d="M 8,122 C 20,95 45,70 75,48 C 100,28 125,14 142,6" stroke="#c9a84c" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      <path d="M 30,96 C 38,80 50,66 60,54" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 65,58 C 78,46 90,36 102,26" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 28,90 C 16,80 18,66 28,62 C 34,74 34,84 28,90Z" fill="#c9a84c" fillOpacity="0.35"/>
      <path d="M 56,62 C 44,54 46,40 56,36 C 62,48 62,56 56,62Z" fill="#c9a84c" fillOpacity="0.35"/>
      <path d="M 88,36 C 78,28 80,16 90,12 C 95,22 93,32 88,36Z" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="52" r="3"   fill="#c9a84c" fillOpacity="0.7"/>
      <circle cx="56" cy="48" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="68" cy="48" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="42" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="58" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="104" cy="24" r="3.5" fill="#c9a84c" fillOpacity="0.7"/>
      <circle cx="97"  cy="20" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="111" cy="20" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="104" cy="14" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="104" cy="30" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="135" cy="10" r="2.5" fill="#c9a84c" fillOpacity="0.6"/>
      <circle cx="141" cy="6"  r="2"   fill="#c9a84c" fillOpacity="0.5"/>
      <circle cx="128" cy="8"  r="2"   fill="#c9a84c" fillOpacity="0.4"/>
    </svg>
  );
}

// ─── Floating petals ──────────────────────────────────────────────────────────
const PETAL_CHARS = ["✿", "❀", "✾", "❁", "✿", "❀"];
function FloatingPetals() {
  const petals = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    char: PETAL_CHARS[i % PETAL_CHARS.length],
    left: `${(i * 13) % 100}%`,
    delay: `${i * 1.4}s`,
    duration: `${11 + (i % 4) * 3}s`,
    size: `${12 + (i % 3) * 3}px`,
    color: i % 2 === 0 ? "#c9a84c" : "#e8d090",
  }));
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {petals.map((p) => (
        <div key={p.id} className="petal" style={{ left: p.left, top: "-20px", fontSize: p.size, color: p.color, animationDuration: p.duration, animationDelay: p.delay }}>
          {p.char}
        </div>
      ))}
    </div>
  );
}

// ─── Search bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" style={{ fontSize: 18 }}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your name…"
        className="search-input w-full pl-11 pr-10 py-4 rounded-2xl text-base"
        style={{ fontFamily: "'Lato', sans-serif" }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {value && (
        <button onClick={() => onChange("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-700 transition-colors" style={{ fontSize: 18 }} aria-label="Clear">
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Highlight helper ─────────────────────────────────────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const esc = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${esc})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">{p}</mark>
      : p
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ guest, query, onShowMap }: { guest: GuestRecord; query: string; onShowMap: () => void }) {
  return (
    <div className="glass-card-dark rounded-3xl p-5 animate-fade-in-scale w-full">
      <div className="flex flex-col items-center mb-5">
        <div className="table-badge text-white rounded-full w-20 h-20 flex flex-col items-center justify-center mb-3 shadow-lg">
          <span className="text-xs uppercase tracking-widest opacity-80" style={{ fontFamily: "'Lato', sans-serif" }}>Table</span>
          <span className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{guest.tableNumber}</span>
        </div>
        <h2 className="text-xl font-bold text-stone-800 text-center leading-snug px-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          {highlightMatch(guest.name, query)}
        </h2>
        <p className="text-amber-600 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>Your assigned seat ✦</p>

        {/* View on Map button */}
        <button
          onClick={onShowMap}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95 hover:opacity-90"
          style={{
            background: "linear-gradient(135deg,#22c55e 0%,#15803d 100%)",
            boxShadow: "0 4px 14px rgba(34,197,94,0.4)",
            fontFamily: "'Lato', sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          View Table on Map
        </button>
      </div>

      <div className="divider-ornament px-4 mb-4">
        <span className="text-amber-500 text-xs whitespace-nowrap" style={{ fontFamily: "'Lato', sans-serif" }}>Your Tablemates</span>
      </div>

      <div className="flex flex-col gap-2">
        {guest.tablemates.map((name, i) => (
          <div key={i} className="guest-chip rounded-xl px-4 py-2.5 flex items-center gap-2 animate-slide-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="text-amber-500 text-sm shrink-0">✿</span>
            <span className="text-stone-700 text-sm font-medium" style={{ fontFamily: "'Lato', sans-serif" }}>{name}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-amber-200/60 text-center">
        <p className="text-amber-600/70 text-xs italic" style={{ fontFamily: "'Lato', sans-serif" }}>🥂 Wishing you a wonderful celebration!</p>
      </div>
    </div>
  );
}

// ─── Multiple matches ─────────────────────────────────────────────────────────
function MultiResults({ results, onSelect }: { results: GuestRecord[]; onSelect: (g: GuestRecord) => void }) {
  return (
    <div className="glass-card rounded-3xl p-5 animate-fade-in-scale w-full">
      <p className="text-stone-700 font-semibold text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
        Multiple matches — please select:
      </p>
      <div className="flex flex-col gap-2">
        {results.map((g, i) => (
          <button key={i} onClick={() => onSelect(g)} className="guest-chip rounded-xl px-4 py-3 flex items-center justify-between text-left w-full animate-slide-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <span className="text-stone-700 font-medium text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>{g.name}</span>
            <span className="text-amber-600 text-sm font-semibold shrink-0 ml-3" style={{ fontFamily: "'Playfair Display', serif" }}>Table {g.tableNumber}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── No result ────────────────────────────────────────────────────────────────
function NoResult({ query }: { query: string }) {
  return (
    <div className="glass-card rounded-3xl p-7 text-center animate-fade-in-scale w-full">
      <div className="text-4xl mb-3">🔎</div>
      <h3 className="text-lg font-bold text-stone-800 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Guest Not Found</h3>
      <p className="text-stone-500 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
        We couldn&apos;t find &ldquo;<span className="font-semibold text-stone-700">{query}</span>&rdquo; in our guest list.
      </p>
      <p className="text-amber-600/60 text-xs mt-2" style={{ fontFamily: "'Lato', sans-serif" }}>Try a shorter name or check the spelling.</p>
    </div>
  );
}

// ─── Location modal ───────────────────────────────────────────────────────────
const GMAPS_LINK = "https://maps.app.goo.gl/moqzTwRBUERuzCvW8";

function LocationModal({ onClose }: { onClose: () => void }) {
  // Close on backdrop click
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(30,20,10,0.55)", backdropFilter: "blur(4px)" }}
      onClick={onBackdrop}
    >
      <div
        className="w-full sm:max-w-lg mx-0 sm:mx-4 animate-slide-up-modal"
        style={{ maxHeight: "92vh" }}
      >
        {/* Card */}
        <div className="rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" style={{ background: "#fffdf5", border: "1px solid rgba(201,168,76,0.3)" }}>

          {/* Handle bar (mobile) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.4)" }} />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#c9a84c,#a8862e)", boxShadow: "0 3px 10px rgba(180,140,40,0.35)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-stone-800 text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Centauria Lake Resort</p>
                <p className="text-amber-600/70 text-xs" style={{ fontFamily: "'Lato', sans-serif" }}>Belihuloya, Sri Lanka</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-amber-50" style={{ color: "#a08030" }} aria-label="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Map iframe */}
          <div className="w-full relative" style={{ height: "260px" }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.5699651334317!2d80.85353937570434!3d6.320077625492375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae6aa7dbe0ccee7%3A0x3c8e9281627d618c!2sCentauria%20Lake%20Resort!5e0!3m2!1sen!2slk!4v1778907079959!5m2!1sen!2slk"
              width="100%"
              height="100%"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Centauria Lake Resort"
            />
          </div>

          {/* Open in Maps CTA */}
          <div className="p-4">
            <div className="rounded-2xl p-3 mb-3 flex items-start gap-3" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.22)" }}>
              <span className="text-lg shrink-0 mt-0.5">📍</span>
              <p className="text-stone-600 text-xs leading-relaxed" style={{ fontFamily: "'Lato', sans-serif" }}>
                Tap <strong className="text-stone-800">Open in Google Maps</strong> to get turn-by-turn directions straight to the venue on your phone.
              </p>
            </div>
            <a
              href={GMAPS_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-semibold text-white text-sm transition-opacity active:opacity-80"
              style={{ background: "linear-gradient(135deg,#c9a84c 0%,#a8862e 100%)", boxShadow: "0 4px 16px rgba(180,140,40,0.38)", fontFamily: "'Lato', sans-serif", letterSpacing: "0.04em" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Floating location button ─────────────────────────────────────────────────
// ─── Memories FAB ─────────────────────────────────────────────────────────────
// ─── Background music ─────────────────────────────────────────────────────────
// Shared Web Audio analyser — set once, read by MusicWave
let _analyser: AnalyserNode | null = null;
let _freqData: Uint8Array<ArrayBuffer> | null = null;

function setupAnalyser(audio: HTMLAudioElement) {
  if (_analyser) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    const src = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    _analyser = analyser;
    _freqData  = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    if (ctx.state === "suspended") ctx.resume();
  } catch (_) { /* unsupported — wave falls back to simulation */ }
}

function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fadeIn = () => {
      audio.volume = 0;
      let v = 0;
      const id = setInterval(() => {
        v = Math.min(v + 0.02, 0.3);
        audio.volume = v;
        if (v >= 0.3) clearInterval(id);
      }, 120);
    };

    const start = () => {
      setupAnalyser(audio);
      audio.play().then(fadeIn).catch(() => {});
    };

    audio.play()
      .then(() => { setupAnalyser(audio); fadeIn(); })
      .catch(() => {
        window.addEventListener("touchstart", start, { once: true, passive: true });
        window.addEventListener("click",      start, { once: true });
        window.addEventListener("scroll",     start, { once: true, passive: true });
      });
  }, []);

  return <audio ref={audioRef} src="/bruno-mars-marry-you_(MP3.co).mp3" loop preload="auto" />;
}

// ─── Music wave (bottom of page, canvas-based) ────────────────────────────────
function roundedTopBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

function MusicWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Reveal on scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold: 0.05 }
    );
    if (wrapRef.current) obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Canvas draw loop
  useEffect(() => {
    if (!inView) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = canvas.getContext("2d");
    if (!c) return;

    const dpr  = window.devicePixelRatio || 1;
    const W    = canvas.offsetWidth  * dpr;
    const H    = canvas.offsetHeight * dpr;
    canvas.width  = W;
    canvas.height = H;

    const BARS  = 58;
    const barW  = W / BARS;
    const halfH = H / 2;

    const draw = () => {
      c.clearRect(0, 0, W, H);
      const t = Date.now() / 1000;

      if (_analyser && _freqData) _analyser.getByteFrequencyData(_freqData);

      for (let i = 0; i < BARS; i++) {
        let amp: number; // 0–1

        if (_analyser && _freqData) {
          const bin = Math.floor((i / BARS) * (_freqData.length * 0.72));
          amp = _freqData[bin] / 255;
        } else {
          // Smooth sine-wave simulation that looks like real audio
          const n = i / BARS;
          amp = Math.max(
            0.04,
            (Math.sin(t * 2.6 + n * Math.PI * 4.2) * 0.30 +
             Math.sin(t * 1.9 + n * Math.PI * 7.5) * 0.22 +
             Math.sin(t * 3.8 + n * Math.PI * 1.8) * 0.16 +
             0.48)
          );
        }

        const barH  = amp * halfH * 0.92;
        const x     = i * barW;
        const r     = Math.min(3 * dpr, barW * 0.38);

        // Gradient: dark gold → bright gold
        const grad = c.createLinearGradient(0, halfH - barH, 0, halfH + barH);
        grad.addColorStop(0,   "rgba(245,218,68,0.75)");
        grad.addColorStop(0.4, "rgba(201,168,76,0.85)");
        grad.addColorStop(1,   "rgba(139,105,20,0.55)");
        c.fillStyle = grad;

        // Upper half (grows upward from center)
        roundedTopBar(c, x + 1, halfH - barH, barW - 2, barH, r);
        // Lower half (mirror, grows downward)
        c.save();
        c.translate(x + barW / 2, halfH);
        c.scale(1, -1);
        c.translate(-(x + barW / 2), -halfH);
        roundedTopBar(c, x + 1, halfH - barH, barW - 2, barH, r);
        c.restore();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [inView]);

  return (
    <div
      ref={wrapRef}
      className="w-full"
      style={{
        opacity:    inView ? 1 : 0,
        transition: "opacity 1.2s ease",
        filter:     "blur(1px)",
      }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "72px", display: "block", opacity: 0.48 }}
      />
    </div>
  );
}

function MemoriesFAB() {
  return (
    <a
      href="https://nushan-dineshka-wedding-app-1loy.vercel.app/"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Share your wedding memories"
      className="fixed bottom-28 right-5 z-40 flex flex-col items-center gap-1 group"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping-slow opacity-25" style={{ background: "#e8a0b4", borderRadius: "50%" }} aria-hidden />
      {/* Button */}
      <span
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:scale-105"
        style={{ background: "linear-gradient(135deg,#e8a0b4 0%,#b5587a 100%)", boxShadow: "0 6px 20px rgba(181,88,122,0.45)" }}
      >
        {/* Camera icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </span>
      <span className="relative text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,253,240,0.95)", color: "#b5587a", fontFamily: "'Lato', sans-serif", boxShadow: "0 2px 8px rgba(181,88,122,0.18)", fontSize: "10px", letterSpacing: "0.03em" }}>
        Memories
      </span>
    </a>
  );
}

function LocationFAB({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="View venue location"
      className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-1 group"
    >
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping-slow opacity-30" style={{ background: "#c9a84c", borderRadius: "50%" }} aria-hidden />
      {/* Button */}
      <span
        className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:scale-105"
        style={{ background: "linear-gradient(135deg,#c9a84c 0%,#8b6914 100%)", boxShadow: "0 6px 20px rgba(180,140,40,0.45)" }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </span>
      <span className="relative text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,253,240,0.95)", color: "#8b6914", fontFamily: "'Lato', sans-serif", boxShadow: "0 2px 8px rgba(180,140,40,0.18)", fontSize: "10px", letterSpacing: "0.03em" }}>
        Venue
      </span>
    </button>
  );
}

// ─── Band Section ─────────────────────────────────────────────────────────────
const BAND_VIDEO_ID = "GR4B9PRz-rA";
const BAND_CHANNEL  = "https://www.youtube.com/@HopeBandSL";

function BandSection() {
  const [inView,   setInView]   = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={sectionRef}
      className="w-full mt-2 mb-8"
      style={{
        opacity:    inView ? 1 : 0,
        transform:  inView ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {/* Section header */}
      <div className="text-center mb-5">
        <div className="divider-ornament px-6 mb-4">
          <span style={{ fontSize: "16px" }}>🎵</span>
        </div>
        <p className="text-stone-500 text-xs uppercase" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.38em" }}>
          Live Entertainment
        </p>
        <h3 className="font-bold text-stone-800 mt-1.5" style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.45rem", letterSpacing: "0.06em" }}>
          Hope Band SL
        </h3>
        <p className="text-amber-600/70 text-xs mt-1" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em" }}>
          Performing live at Nushan &amp; Dineshka&apos;s wedding ✦
        </p>
      </div>

      {/* Video card */}
      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ position: "relative", aspectRatio: "16/9" }}
      >
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${BAND_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            width="100%"
            height="100%"
            style={{ border: 0, display: "block" }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="Hope Band SL – Live Performance"
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="absolute inset-0 w-full h-full flex flex-col items-center justify-center group"
            aria-label="Play Hope Band SL video"
          >
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${BAND_VIDEO_ID}/hqdefault.jpg`}
              alt="Hope Band SL live performance"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: 0.82 }}
            />
            {/* Dark overlay */}
            <div className="absolute inset-0" style={{ background: "rgba(20,12,4,0.32)" }} />
            {/* Play button */}
            <div className="relative flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 group-active:scale-95 transition-transform"
                style={{
                  background: "linear-gradient(135deg,#c9a84c,#8b6914)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
                  ...(inView ? { animation: "heartbeat 2s ease-in-out infinite" } : {}),
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </div>
              <span
                className="relative text-white text-xs font-semibold px-3 py-1 rounded-full"
                style={{ background: "rgba(0,0,0,0.45)", fontFamily: "'Lato', sans-serif", letterSpacing: "0.08em" }}
              >
                Watch Live Performance
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Channel link */}
      <div className="text-center mt-3">
        <a
          href={BAND_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
          style={{ fontFamily: "'Lato', sans-serif", fontSize: "11px", color: "#a07840", letterSpacing: "0.06em" }}
        >
          {/* YouTube icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          View Hope Band SL on YouTube
        </a>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="text-center mt-10 pb-8">
      <div className="divider-ornament px-8 mb-5">
        <span className="text-amber-500 text-sm">✦</span>
      </div>
      <p className="text-stone-700 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Nushan &amp; Dineshka</p>
      <p className="text-amber-600/70 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.18em" }}>18 · 05 · 2026</p>
      <div className="flex justify-center gap-3 mt-3">
        <span style={{ color: "#c9a84c" }}>✿</span>
        <span style={{ color: "#d4af60" }}>❀</span>
        <span style={{ color: "#c9a84c" }}>✿</span>
      </div>
    </footer>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────
const fuse = new Fuse(buildGuestIndex(SEATING_DATA), {
  keys: ["name"],
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

export default function WeddingSeatingApp() {
  const [query, setQuery]               = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults]           = useState<GuestRecord[]>([]);
  const [selected, setSelected]         = useState<GuestRecord | null>(null);
  const [showMap, setShowMap]           = useState(false);
  const [showAgenda, setShowAgenda]     = useState(false);
  const [showSeatingMap, setShowSeatingMap] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounce: wait 500ms after user stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Run search only on debounced value
  useEffect(() => {
    setSelected(null);
    const q = debouncedQuery.trim();
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const found = fuse.search(q).map((r) => r.item);
    const exact = found.filter((g) => g.name.toLowerCase() === q.toLowerCase());
    if (exact.length === 1) {
      setSelected(exact[0]);
      setResults([]);
    } else if (found.length === 1) {
      setSelected(found[0]);
      setResults([]);
    } else {
      setResults(found.slice(0, 8));
    }
    // Scroll to results once, after search settles
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, [debouncedQuery]);

  const hasResult = selected || results.length > 0 || query.trim().length >= 2;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingPetals />
      {showMap && <LocationModal onClose={() => setShowMap(false)} />}
      {showAgenda && <AgendaModal onClose={() => setShowAgenda(false)} />}
      {showSeatingMap && selected && (
        <SeatingMapModal tableNumber={selected.tableNumber} onClose={() => setShowSeatingMap(false)} />
      )}
      <BackgroundMusic />
      <MemoriesFAB />
      <LocationFAB onClick={() => setShowMap(true)} />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">

        {/* ── Hero ── */}
        <div className="text-center mb-6 w-full">
          {/* Corners + SEATING PLAN */}
          <div className="flex items-center justify-between w-full mb-0">
            <div className="shrink-0"><FloralCorner /></div>
            <div className="flex flex-col items-center flex-1 min-w-0">
              <h1 className="font-bold leading-none text-stone-800" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.18em", fontSize: "clamp(1.7rem, 7.5vw, 3.5rem)" }}>
                SEATING
              </h1>
              <h1 className="font-bold leading-none gold-shimmer" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.18em", fontSize: "clamp(1.7rem, 7.5vw, 3.5rem)" }}>
                PLAN
              </h1>
            </div>
            <div className="shrink-0"><FloralCorner flip /></div>
          </div>

          <div className="divider-ornament mt-3 mb-3 px-4" />

          <p className="text-stone-500 text-xs uppercase mb-2" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.4em" }}>
            Welcome to the wedding of
          </p>
          <h2 className="font-bold text-stone-800 uppercase" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.15em", fontSize: "clamp(1.25rem, 5.5vw, 2rem)" }}>
            Nushan &amp; Dineshka
          </h2>
          <p className="text-amber-700 text-xs uppercase mt-2" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.3em" }}>
            ✦ &nbsp; 18 May 2026 &nbsp; ✦
          </p>

          <div className="divider-ornament mt-3 px-6">
            <span className="text-amber-500 text-xs">❧</span>
          </div>

          <CountdownClock />
        </div>

        {/* ── Search bar — right after hero ── */}
        <div className="mb-4 w-full">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* ── Results area ── */}
        <div ref={resultsRef}>
          {selected ? (
            <ResultCard guest={selected} query={query} onShowMap={() => setShowSeatingMap(true)} />
          ) : results.length > 0 ? (
            <MultiResults results={results} onSelect={setSelected} />
          ) : query.trim().length >= 2 ? (
            <NoResult query={query} />
          ) : (
            /* Welcome card — shown only when not searching */
            <div className="glass-card rounded-3xl p-6 text-center w-full">
              <div className="text-3xl mb-2">✿</div>
              <p className="text-stone-700 font-medium text-base" style={{ fontFamily: "'Playfair Display', serif" }}>
                Welcome, dear guest!
              </p>
              <p className="text-amber-600/60 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>
                Type your name above to find your table.
              </p>
            </div>
          )}
        </div>

        {/* ── Stats — shown below results only when not actively searching ── */}
        {!hasResult && (
          <div className="flex justify-center gap-4 mt-6">
            {/* Tables card — SVG table icon */}
            <div className="glass-card rounded-2xl px-5 py-3 text-center flex-1 max-w-[130px]">
              <div className="flex justify-center mb-0.5">
                <svg width="22" height="20" viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Table top */}
                  <rect x="1" y="3" width="20" height="4" rx="2" fill="#c9a84c"/>
                  {/* Left leg */}
                  <rect x="3" y="7" width="2.5" height="10" rx="1.2" fill="#c9a84c"/>
                  {/* Right leg */}
                  <rect x="16.5" y="7" width="2.5" height="10" rx="1.2" fill="#c9a84c"/>
                  {/* Foot left */}
                  <rect x="1.5" y="16" width="5" height="2" rx="1" fill="#a8862e"/>
                  {/* Foot right */}
                  <rect x="15.5" y="16" width="5" height="2" rx="1" fill="#a8862e"/>
                </svg>
              </div>
              <div className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>17</div>
              <div className="text-amber-600/70 text-xs uppercase tracking-wider" style={{ fontFamily: "'Lato', sans-serif" }}>Tables</div>
            </div>
            {/* Guests card */}
            <div className="glass-card rounded-2xl px-5 py-3 text-center flex-1 max-w-[130px]">
              <div className="text-base">👥</div>
              <div className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>150+</div>
              <div className="text-amber-600/70 text-xs uppercase tracking-wider" style={{ fontFamily: "'Lato', sans-serif" }}>Guests</div>
            </div>
          </div>
        )}

        <Footer />
        <EnvelopeButton onClick={() => setShowAgenda(true)} />
        <BandSection />
        <MusicWave />
      </div>
    </div>
  );
}
