"use client";

import { useState, useEffect, useRef } from "react";
import Fuse from "fuse.js";
import { SEATING_DATA, buildGuestIndex, type GuestRecord } from "@/lib/seatingData";

// ─── Botanical SVG corner decoration ─────────────────────────────────────────
function FloralCorner({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="100"
      height="90"
      viewBox="0 0 150 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined, opacity: 0.75 }}
      aria-hidden
    >
      <path d="M 8,122 C 20,95 45,70 75,48 C 100,28 125,14 142,6" stroke="#c9a84c" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      <path d="M 30,96 C 38,80 50,66 60,54" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 65,58 C 78,46 90,36 102,26" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      <path d="M 28,90 C 16,80 18,66 28,62 C 34,74 34,84 28,90Z" fill="#c9a84c" fillOpacity="0.35"/>
      <path d="M 56,62 C 44,54 46,40 56,36 C 62,48 62,56 56,62Z" fill="#c9a84c" fillOpacity="0.35"/>
      <path d="M 88,36 C 78,28 80,16 90,12 C 95,22 93,32 88,36Z" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="52" r="3" fill="#c9a84c" fillOpacity="0.7"/>
      <circle cx="56" cy="48" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="68" cy="48" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="42" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="58" r="2" fill="#c9a84c" fillOpacity="0.35"/>
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

// ─── Floating Petals ─────────────────────────────────────────────────────────
const PETAL_CHARS = ["✿", "❀", "✾", "❁", "✿", "❀"];

function FloatingPetals() {
  const petals = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    char: PETAL_CHARS[i % PETAL_CHARS.length],
    left: `${(i * 10.5) % 100}%`,
    delay: `${i * 1.1}s`,
    duration: `${10 + (i % 5) * 2.5}s`,
    size: `${11 + (i % 3) * 3}px`,
    color: i % 2 === 0 ? "#c9a84c" : "#e8d090",
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: p.left,
            top: "-20px",
            fontSize: p.size,
            color: p.color,
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        >
          {p.char}
        </div>
      ))}
    </div>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <div className="text-center mb-8 w-full">
      {/* Botanical corners + SEATING PLAN */}
      <div className="flex items-center justify-between w-full mb-0">
        <div className="shrink-0">
          <FloralCorner />
        </div>
        <div className="flex flex-col items-center min-w-0 flex-1">
          <h1
            className="font-bold leading-none text-stone-800"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.18em",
              fontSize: "clamp(2rem, 8vw, 4rem)",
            }}
          >
            SEATING
          </h1>
          <h1
            className="font-bold leading-none gold-shimmer"
            style={{
              fontFamily: "'Playfair Display', serif",
              letterSpacing: "0.18em",
              fontSize: "clamp(2rem, 8vw, 4rem)",
            }}
          >
            PLAN
          </h1>
        </div>
        <div className="shrink-0">
          <FloralCorner flip />
        </div>
      </div>

      <div className="divider-ornament mt-3 mb-4 px-4" />

      <p
        className="text-stone-500 text-xs uppercase mb-3"
        style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.4em" }}
      >
        Welcome to the wedding of
      </p>

      <h2
        className="font-bold text-stone-800 uppercase"
        style={{
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "0.15em",
          fontSize: "clamp(1.4rem, 6vw, 2.25rem)",
        }}
      >
        Nushan &amp; Dineshka
      </h2>

      <p
        className="text-amber-700 text-xs uppercase mt-3"
        style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.3em" }}
      >
        ✦ &nbsp; 18 May 2026 &nbsp; ✦
      </p>

      <div className="divider-ornament mt-4 px-6">
        <span className="text-amber-500 text-xs">❧</span>
      </div>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 text-lg pointer-events-none">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your name to find your table…"
        className="search-input w-full pl-11 pr-10 py-4 rounded-2xl text-base"
        style={{ fontFamily: "'Lato', sans-serif" }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-700 text-lg transition-colors"
          aria-label="Clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const cleanQ = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${cleanQ})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">{p}</mark>
    ) : p
  );
}

function ResultCard({ guest, query }: { guest: GuestRecord; query: string }) {
  return (
    <div className="glass-card-dark rounded-3xl p-5 animate-fade-in-scale w-full">
      <div className="flex flex-col items-center mb-5">
        <div className="table-badge text-white rounded-full w-20 h-20 flex flex-col items-center justify-center mb-3 shadow-lg">
          <span className="text-xs uppercase tracking-widest opacity-80" style={{ fontFamily: "'Lato', sans-serif" }}>
            Table
          </span>
          <span className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {guest.tableNumber}
          </span>
        </div>
        <h2
          className="text-xl font-bold text-stone-800 text-center leading-tight px-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {highlightMatch(guest.name, query)}
        </h2>
        <p className="text-amber-600 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>
          Your assigned seat ✦
        </p>
      </div>

      <div className="divider-ornament px-4 mb-4">
        <span className="text-amber-500 text-xs whitespace-nowrap" style={{ fontFamily: "'Lato', sans-serif" }}>
          Your Tablemates
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {guest.tablemates.map((name, i) => (
          <div
            key={i}
            className="guest-chip rounded-xl px-4 py-2.5 flex items-center gap-2 animate-slide-in-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-amber-500 text-sm shrink-0">✿</span>
            <span
              className="text-stone-700 text-sm font-medium"
              style={{ fontFamily: "'Lato', sans-serif", wordBreak: "break-word" }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-amber-200/60 text-center">
        <p className="text-amber-600/70 text-xs italic" style={{ fontFamily: "'Lato', sans-serif" }}>
          🥂 Wishing you a wonderful celebration!
        </p>
      </div>
    </div>
  );
}

// ─── Multiple Results ─────────────────────────────────────────────────────────
function MultiResults({ results, onSelect }: { results: GuestRecord[]; onSelect: (g: GuestRecord) => void }) {
  return (
    <div className="glass-card rounded-3xl p-5 animate-fade-in-scale w-full">
      <p className="text-stone-700 font-semibold text-center mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
        Multiple matches — please select:
      </p>
      <div className="flex flex-col gap-2">
        {results.map((g, i) => (
          <button
            key={i}
            onClick={() => onSelect(g)}
            className="guest-chip rounded-xl px-4 py-3 flex items-center justify-between text-left w-full animate-slide-in-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="text-stone-700 font-medium text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
              {g.name}
            </span>
            <span className="text-amber-600 text-sm font-semibold shrink-0 ml-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Table {g.tableNumber}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── No Result ────────────────────────────────────────────────────────────────
function NoResult({ query }: { query: string }) {
  return (
    <div className="glass-card rounded-3xl p-8 text-center animate-fade-in-scale w-full">
      <div className="text-4xl mb-3">🔎</div>
      <h3 className="text-lg font-bold text-stone-800 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        Guest Not Found
      </h3>
      <p className="text-stone-500 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
        We couldn&apos;t find &ldquo;<span className="font-semibold text-stone-700">{query}</span>&rdquo; in our guest list.
      </p>
      <p className="text-amber-600/60 text-xs mt-2" style={{ fontFamily: "'Lato', sans-serif" }}>
        Try a shorter name or check the spelling.
      </p>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="text-center mt-12 pb-8 px-4">
      <div className="divider-ornament px-8 mb-5">
        <span className="text-amber-500 text-sm">✦</span>
      </div>
      <p className="text-stone-700 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
        Nushan &amp; Dineshka
      </p>
      <p className="text-amber-600/70 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.18em" }}>
        18 · 05 · 2026
      </p>
      <div className="flex justify-center gap-3 mt-3">
        <span style={{ color: "#c9a84c" }}>✿</span>
        <span style={{ color: "#d4af60" }}>❀</span>
        <span style={{ color: "#c9a84c" }}>✿</span>
      </div>
    </footer>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function WeddingSeatingApp() {
  const [fuse] = useState(
    () => new Fuse(buildGuestIndex(SEATING_DATA), {
      keys: ["name"],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
    })
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuestRecord[]>([]);
  const [selected, setSelected] = useState<GuestRecord | null>(null);

  useEffect(() => {
    setSelected(null);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const found = fuse.search(query.trim()).map((r) => r.item);
    const exact = found.filter((g) => g.name.toLowerCase() === query.trim().toLowerCase());
    if (exact.length === 1) {
      setSelected(exact[0]);
      setResults([]);
    } else if (found.length === 1) {
      setSelected(found[0]);
      setResults([]);
    } else {
      setResults(found.slice(0, 8));
    }
  }, [query, fuse]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingPetals />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        <HeroSection />

        {/* Stats */}
        <div className="flex justify-center gap-4 mb-8">
          {[
            { label: "Tables", value: 15, icon: "🪑" },
            { label: "Guests", value: 137, icon: "👥" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card rounded-2xl px-5 py-3 text-center flex-1 max-w-[140px]">
              <div className="text-lg">{icon}</div>
              <div className="text-2xl font-bold text-stone-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                {value}
              </div>
              <div className="text-amber-600/70 text-xs uppercase tracking-wider" style={{ fontFamily: "'Lato', sans-serif" }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-5 w-full">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* Results */}
        {selected ? (
          <ResultCard guest={selected} query={query} />
        ) : results.length > 0 ? (
          <MultiResults results={results} onSelect={setSelected} />
        ) : query.trim().length >= 2 ? (
          <NoResult query={query} />
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center w-full">
            <div className="text-4xl mb-3">✿</div>
            <p className="text-stone-700 font-medium text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome, dear guest!
            </p>
            <p className="text-amber-600/60 text-sm mt-2" style={{ fontFamily: "'Lato', sans-serif" }}>
              Type your name above to find your table assignment.
            </p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
