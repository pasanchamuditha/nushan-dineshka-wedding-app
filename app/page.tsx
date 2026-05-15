"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Fuse from "fuse.js";
import { SEATING_DATA, buildGuestIndex, type GuestRecord, type TableData } from "@/lib/seatingData";
import { parseExcelFile } from "@/lib/parseExcel";

// ─── Botanical SVG corner decoration ─────────────────────────────────────────
function FloralCorner({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      width="150"
      height="130"
      viewBox="0 0 150 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: flip ? "scaleX(-1)" : undefined, opacity: 0.75 }}
      aria-hidden
    >
      {/* Main arching stem */}
      <path d="M 8,122 C 20,95 45,70 75,48 C 100,28 125,14 142,6" stroke="#c9a84c" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
      {/* Branch left */}
      <path d="M 30,96 C 38,80 50,66 60,54" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      {/* Branch right */}
      <path d="M 65,58 C 78,46 90,36 102,26" stroke="#c9a84c" strokeWidth="1" fill="none" strokeLinecap="round"/>
      {/* Leaf 1 */}
      <path d="M 28,90 C 16,80 18,66 28,62 C 34,74 34,84 28,90Z" fill="#c9a84c" fillOpacity="0.35"/>
      {/* Leaf 2 */}
      <path d="M 56,62 C 44,54 46,40 56,36 C 62,48 62,56 56,62Z" fill="#c9a84c" fillOpacity="0.35"/>
      {/* Leaf 3 */}
      <path d="M 88,36 C 78,28 80,16 90,12 C 95,22 93,32 88,36Z" fill="#c9a84c" fillOpacity="0.35"/>
      {/* Small flower 1 */}
      <circle cx="62" cy="52" r="3" fill="#c9a84c" fillOpacity="0.7"/>
      <circle cx="56" cy="48" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="68" cy="48" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="42" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="62" cy="58" r="2" fill="#c9a84c" fillOpacity="0.35"/>
      {/* Small flower 2 */}
      <circle cx="104" cy="24" r="3.5" fill="#c9a84c" fillOpacity="0.7"/>
      <circle cx="97"  cy="20" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="111" cy="20" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="104" cy="14" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      <circle cx="104" cy="30" r="2"   fill="#c9a84c" fillOpacity="0.35"/>
      {/* Tiny bud cluster */}
      <circle cx="135" cy="10" r="2.5" fill="#c9a84c" fillOpacity="0.6"/>
      <circle cx="141" cy="6"  r="2"   fill="#c9a84c" fillOpacity="0.5"/>
      <circle cx="128" cy="8"  r="2"   fill="#c9a84c" fillOpacity="0.4"/>
      {/* Trailing dots / tiny buds */}
      <circle cx="18" cy="110" r="1.5" fill="#c9a84c" fillOpacity="0.4"/>
      <circle cx="38" cy="80"  r="1.5" fill="#c9a84c" fillOpacity="0.4"/>
      <circle cx="78" cy="45"  r="1.5" fill="#c9a84c" fillOpacity="0.4"/>
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
    <div className="text-center mb-10 px-2">
      {/* Botanical corner decorations + SEATING PLAN banner */}
      <div className="relative flex items-center justify-between mb-0">
        <div className="shrink-0 -mb-4">
          <FloralCorner />
        </div>

        <div className="flex-1 flex flex-col items-center px-2">
          {/* SEATING PLAN */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-widest text-stone-800"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.18em" }}
          >
            SEATING
          </h1>
          <h1
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-none tracking-widest gold-shimmer"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.18em" }}
          >
            PLAN
          </h1>
        </div>

        <div className="shrink-0 -mb-4">
          <FloralCorner flip />
        </div>
      </div>

      {/* Thin gold rule */}
      <div className="divider-ornament mt-4 mb-4 px-6" />

      {/* "Welcome to the wedding of" */}
      <p
        className="text-stone-500 text-xs tracking-[0.45em] uppercase mb-3"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        Welcome to the wedding of
      </p>

      {/* Couple names */}
      <h2
        className="text-3xl sm:text-4xl font-bold text-stone-800 tracking-[0.2em] uppercase"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Nushan &amp; Dineshka
      </h2>

      {/* Wedding date */}
      <p
        className="text-amber-700 tracking-[0.3em] text-xs uppercase mt-3"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        ✦ &nbsp; 17 May 2026 &nbsp; ✦
      </p>

      <div className="divider-ornament mt-5 px-8">
        <span className="text-amber-500 text-xs">❧</span>
      </div>
    </div>
  );
}

// ─── Upload Zone ──────────────────────────────────────────────────────────────
interface UploadZoneProps {
  onData: (data: TableData) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
}

function UploadZone({ onData, isLoading, setIsLoading }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const data = await parseExcelFile(file);
      onData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse file.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="mb-8">
      <div
        className={`upload-zone rounded-2xl p-8 text-center cursor-pointer ${isDragging ? "drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            <p className="text-amber-700 font-medium" style={{ fontFamily: "'Lato', sans-serif" }}>
              Processing your guest list...
            </p>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-3">📊</div>
            <p className="text-stone-700 font-semibold text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Upload Seating Excel File
            </p>
            <p className="text-amber-600/70 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
              Drag & drop or click to browse · .xlsx / .xls
            </p>
          </>
        )}
      </div>
      {error && (
        <p className="mt-2 text-center text-red-500 text-sm" style={{ fontFamily: "'Lato', sans-serif" }}>
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 text-xl pointer-events-none">
        🔍
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Type your name to find your table…"}
        className="search-input w-full pl-12 pr-12 py-4 rounded-2xl text-lg"
        style={{ fontFamily: "'Lato', sans-serif" }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-700 text-xl transition-colors"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
interface ResultCardProps {
  guest: GuestRecord;
  query: string;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const cleanQ = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${cleanQ})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-amber-100 text-amber-900 rounded px-0.5">
        {p}
      </mark>
    ) : (
      p
    )
  );
}

function ResultCard({ guest, query }: ResultCardProps) {
  return (
    <div className="glass-card-dark rounded-3xl p-6 animate-fade-in-scale">
      {/* Table badge */}
      <div className="flex flex-col items-center mb-6">
        <div className="table-badge text-white rounded-full w-24 h-24 flex flex-col items-center justify-center mb-3 shadow-lg">
          <span className="text-xs uppercase tracking-widest opacity-80" style={{ fontFamily: "'Lato', sans-serif" }}>
            Table
          </span>
          <span className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {guest.tableNumber}
          </span>
        </div>
        <h2
          className="text-2xl font-bold text-stone-800 text-center leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {highlightMatch(guest.name, query)}
        </h2>
        <p className="text-amber-600 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>
          Your assigned seat ✦
        </p>
      </div>

      <div className="divider-ornament px-4 mb-5">
        <span className="text-amber-500 text-xs whitespace-nowrap" style={{ fontFamily: "'Lato', sans-serif" }}>
          Your Tablemates
        </span>
      </div>

      {/* Tablemates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {guest.tablemates.map((name, i) => (
          <div
            key={i}
            className="guest-chip rounded-xl px-4 py-2.5 flex items-center gap-2 animate-slide-in-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <span className="text-amber-500 text-sm">✿</span>
            <span
              className="text-stone-700 text-sm font-medium truncate"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {name}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-amber-200/60 text-center">
        <p
          className="text-amber-600/70 text-xs"
          style={{ fontFamily: "'Lato', sans-serif", fontStyle: "italic" }}
        >
          🥂 Wishing you a wonderful celebration!
        </p>
      </div>
    </div>
  );
}

// ─── Multiple Results ─────────────────────────────────────────────────────────
interface MultiResultProps {
  results: GuestRecord[];
  query: string;
  onSelect: (g: GuestRecord) => void;
}

function MultiResults({ results, query, onSelect }: MultiResultProps) {
  return (
    <div className="glass-card rounded-3xl p-5 animate-fade-in-scale">
      <p
        className="text-stone-700 font-semibold text-center mb-4"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Multiple matches found — please select:
      </p>
      <div className="flex flex-col gap-2">
        {results.map((g, i) => (
          <button
            key={i}
            onClick={() => onSelect(g)}
            className="guest-chip rounded-xl px-4 py-3 flex items-center justify-between text-left w-full animate-slide-in-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span
              className="text-stone-700 font-medium"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              {g.name}
            </span>
            <span
              className="text-amber-600 text-sm font-semibold shrink-0 ml-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
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
    <div className="glass-card rounded-3xl p-8 text-center animate-fade-in-scale">
      <div className="text-5xl mb-4">🔎</div>
      <h3
        className="text-xl font-bold text-stone-800 mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Guest Not Found
      </h3>
      <p
        className="text-stone-500 text-sm"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        We couldn&apos;t find &ldquo;<span className="font-semibold text-stone-700">{query}</span>&rdquo; in our guest list.
      </p>
      <p
        className="text-amber-600/60 text-xs mt-2"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
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
      <p
        className="text-stone-700 text-lg font-semibold"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        Nushan &amp; Dineshka
      </p>
      <p
        className="text-amber-600/70 text-sm mt-1"
        style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.18em" }}
      >
        17 · 05 · 2026
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
  const [tableData, setTableData] = useState<TableData>(SEATING_DATA);
  const [guestIndex, setGuestIndex] = useState<GuestRecord[]>(() => buildGuestIndex(SEATING_DATA));
  const [fuse, setFuse] = useState<Fuse<GuestRecord>>(
    () =>
      new Fuse(buildGuestIndex(SEATING_DATA), {
        keys: ["name"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      })
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuestRecord[]>([]);
  const [selected, setSelected] = useState<GuestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const handleNewData = useCallback((data: TableData) => {
    const index = buildGuestIndex(data);
    setTableData(data);
    setGuestIndex(index);
    setFuse(
      new Fuse(index, {
        keys: ["name"],
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      })
    );
    setQuery("");
    setResults([]);
    setSelected(null);
    setShowUpload(false);
  }, []);

  useEffect(() => {
    setSelected(null);
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const fuseResults = fuse.search(query.trim());
    const found = fuseResults.map((r) => r.item);

    const exact = found.filter(
      (g) => g.name.toLowerCase() === query.trim().toLowerCase()
    );
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

  const totalGuests = guestIndex.length;
  const totalTables = Object.keys(tableData).length;

  return (
    <div className="relative min-h-screen z-10">
      <FloatingPetals />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <HeroSection />

        {/* Stats strip */}
        <div className="flex justify-center gap-6 mb-8">
          {[
            { label: "Tables", value: totalTables, icon: "🪑" },
            { label: "Guests", value: totalGuests, icon: "👥" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="glass-card rounded-2xl px-6 py-3 text-center">
              <div className="text-xl">{icon}</div>
              <div
                className="text-2xl font-bold text-stone-800"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {value}
              </div>
              <div
                className="text-amber-600/70 text-xs uppercase tracking-wider"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Upload toggle */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setShowUpload((v) => !v)}
            className="text-amber-600/70 text-sm underline underline-offset-2 hover:text-amber-800 transition-colors"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {showUpload ? "✕ Cancel upload" : "📁 Upload a different Excel file"}
          </button>
        </div>

        {/* Upload zone */}
        {showUpload && (
          <UploadZone
            onData={handleNewData}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        )}

        {/* Search */}
        <div className="mb-6">
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {/* Results */}
        {selected ? (
          <ResultCard guest={selected} query={query} />
        ) : results.length > 0 ? (
          <MultiResults results={results} query={query} onSelect={setSelected} />
        ) : query.trim().length >= 2 ? (
          <NoResult query={query} />
        ) : (
          <div className="glass-card rounded-3xl p-8 text-center">
            <div className="text-4xl mb-3">✿</div>
            <p
              className="text-stone-700 font-medium text-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Welcome, dear guest!
            </p>
            <p
              className="text-amber-600/60 text-sm mt-2"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              Type your name above to find your table assignment.
            </p>
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}
