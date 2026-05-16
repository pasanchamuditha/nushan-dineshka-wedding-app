"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { SEATING_DATA, buildGuestIndex, type GuestRecord } from "@/lib/seatingData";

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
function ResultCard({ guest, query }: { guest: GuestRecord; query: string }) {
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
  const [query, setQuery]         = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults]     = useState<GuestRecord[]>([]);
  const [selected, setSelected]   = useState<GuestRecord | null>(null);
  const [showMap, setShowMap]     = useState(false);

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
            <ResultCard guest={selected} query={query} />
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
            {[
              { label: "Tables", value: "17", icon: "🪑" },
              { label: "Guests", value: "150+", icon: "👥" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card rounded-2xl px-5 py-3 text-center flex-1 max-w-[130px]">
                <div className="text-base">{icon}</div>
                <div className="text-xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>{value}</div>
                <div className="text-amber-600/70 text-xs uppercase tracking-wider" style={{ fontFamily: "'Lato', sans-serif" }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
