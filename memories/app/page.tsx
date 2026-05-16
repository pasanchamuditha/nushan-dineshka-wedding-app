"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// Compress image to max 1200px wide, JPEG 0.75 quality
function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX) { height = Math.round((height * MAX) / width); width = MAX; }
      if (height > MAX) { width = Math.round((width * MAX) / height); height = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = dataUrl;
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VoteData { h: number; f: number; w: number; l: number; c: number; }

interface Photo {
  id: string;
  name: string;
  thumbnailUrl: string;
  createdAt: string;
  votes?: VoteData;
}

type ReactionKey = "h" | "f" | "w" | "l" | "c";

const REACTIONS: { key: ReactionKey; emoji: string; label: string }[] = [
  { key: "h", emoji: "❤️",  label: "Love"    },
  { key: "f", emoji: "🔥",  label: "Fire"    },
  { key: "w", emoji: "😍",  label: "Wow"     },
  { key: "l", emoji: "😂",  label: "Haha"    },
  { key: "c", emoji: "😢",  label: "Crying"  },
];

function totalVotes(v?: VoteData) {
  return v ? (v.h + v.f + v.w + (v.l ?? 0) + (v.c ?? 0)) : 0;
}

// ─── Floating petals ──────────────────────────────────────────────────────────
function FloatingPetals() {
  const petals = Array.from({ length: 8 }, (_, i) => ({
    id: i, char: ["✿", "❀", "✾", "❁"][i % 4],
    left: `${i * 13}%`, delay: `${i * 1.5}s`,
    duration: `${12 + (i % 4) * 3}s`,
    size: `${11 + (i % 3) * 3}px`,
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

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, visible }: { message: string; type: "success" | "error"; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-medium transition-all duration-300
        ${visible ? "animate-toast-in opacity-100" : "animate-toast-out opacity-0 pointer-events-none"}
        ${type === "success" ? "text-amber-900" : "bg-red-50 text-red-700 border border-red-200"}`}
      style={type === "success" ? {
        transform: "translateX(-50%)",
        background: "linear-gradient(135deg,#fff8e8,#fef3c7)",
        border: "1px solid rgba(201,168,76,0.4)",
        fontFamily: "'Lato', sans-serif",
      } : { transform: "translateX(-50%)", fontFamily: "'Lato', sans-serif" }}
    >
      {type === "success" ? "✦" : "⚠"} {message}
    </div>
  );
}

// ─── Vote banner ──────────────────────────────────────────────────────────────
function VoteBanner() {
  return (
    <div
      className="mb-5 rounded-2xl px-4 py-4 animate-fade-in flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg,rgba(255,248,220,0.97),rgba(255,238,190,0.95))",
        border: "1px solid rgba(201,168,76,0.4)",
      }}
    >
      <span style={{ fontSize: "22px", lineHeight: 1.2, flexShrink: 0 }}>🏆</span>
      <div>
        <p className="font-bold text-stone-800 text-sm leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
          Vote for the Best Memory!
        </p>
        <p className="text-amber-700/80 text-xs mt-1 leading-relaxed" style={{ fontFamily: "'Lato', sans-serif" }}>
          Tap ❤️ 🔥 😍 on your favourite photos. The most-loved memory wins the{" "}
          <span className="font-semibold text-amber-800">Best Photo of the Day 👑</span> award at the end of the celebration!
        </p>
      </div>
    </div>
  );
}

// ─── Photo card with reactions ────────────────────────────────────────────────
function PhotoCard({
  photo, index, myVote, isMostLoved, onOpenLightbox, onVote,
}: {
  photo: Photo;
  index: number;
  myVote?: ReactionKey;
  isMostLoved: boolean;
  onOpenLightbox: () => void;
  onVote: (reaction: ReactionKey) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const total = totalVotes(photo.votes);

  // Close picker when clicking outside (delayed so the opening click doesn't immediately close it)
  useEffect(() => {
    if (!pickerOpen) return;
    let id: ReturnType<typeof setTimeout>;
    const close = () => setPickerOpen(false);
    id = setTimeout(() => window.addEventListener("click", close, { once: true }), 0);
    return () => { clearTimeout(id); window.removeEventListener("click", close); };
  }, [pickerOpen]);

  return (
    <div
      className="photo-item animate-fade-in relative overflow-hidden rounded-xl"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s`, border: isMostLoved && total > 0 ? "2px solid #c9a84c" : "none" }}
    >
      {/* Most Loved badge */}
      {isMostLoved && total > 0 && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-white justify-center"
          style={{ background: "linear-gradient(135deg,#c9a84c,#8b6914)", fontFamily: "'Lato', sans-serif", letterSpacing: "0.04em" }}
        >
          👑 Most Loved · {total} {total === 1 ? "vote" : "votes"}
        </div>
      )}

      {/* Photo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.thumbnailUrl}
        alt={`Wedding memory ${index + 1}`}
        loading="lazy"
        className="w-full cursor-pointer block"
        onClick={onOpenLightbox}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

      {/* Vote button overlay (bottom-left) */}
      <div className="absolute bottom-2 left-2" onClick={(e) => e.stopPropagation()}>
        {/* Reaction picker popup */}
        {pickerOpen && (
          <div
            className="absolute bottom-full left-0 mb-1.5 flex items-center gap-1 px-2 py-1.5 rounded-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "rgba(255,253,240,0.97)",
              border: "1px solid rgba(201,168,76,0.4)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              backdropFilter: "blur(8px)",
            }}
          >
            {REACTIONS.map(({ key, emoji, label }) => {
              const count    = photo.votes?.[key] ?? 0;
              const isMyVote = myVote === key;
              return (
                <button
                  key={key}
                  onClick={() => { onVote(key); setPickerOpen(false); }}
                  className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all active:scale-90"
                  style={{
                    background: isMyVote ? "rgba(201,168,76,0.25)" : "transparent",
                    border: isMyVote ? "1.5px solid rgba(201,168,76,0.6)" : "1.5px solid transparent",
                    minWidth: "36px",
                  }}
                  aria-label={label}
                >
                  <span style={{ fontSize: "20px", lineHeight: 1.1 }}>{emoji}</span>
                  <span style={{ fontSize: "10px", color: isMyVote ? "#8b6914" : "#a07840", fontWeight: isMyVote ? 700 : 400, fontFamily: "'Lato', sans-serif", lineHeight: 1 }}>
                    {count > 0 ? count : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Vote / reacted button */}
        <button
          onClick={() => setPickerOpen((o) => !o)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold active:scale-95 transition-all"
          style={{
            background: myVote ? "rgba(201,168,76,0.88)" : "rgba(20,15,5,0.55)",
            color: myVote ? "#3b2700" : "#fff",
            backdropFilter: "blur(6px)",
            border: myVote ? "1px solid rgba(201,168,76,0.9)" : "1px solid rgba(255,255,255,0.18)",
            fontFamily: "'Lato', sans-serif",
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          {myVote ? (
            <>
              <span style={{ fontSize: "12px" }}>{REACTIONS.find(r => r.key === myVote)?.emoji}</span>
              <span>Voted</span>
            </>
          ) : (
            <>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.85 }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              <span>Vote</span>
            </>
          )}
        </button>
      </div>

      {/* Total reaction count (bottom-right) */}
      {total > 0 && (
        <div
          className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs"
          style={{ background: "rgba(20,15,5,0.55)", color: "#fff", backdropFilter: "blur(6px)", fontFamily: "'Lato', sans-serif", fontSize: "11px" }}
        >
          {REACTIONS.filter(r => (photo.votes?.[r.key] ?? 0) > 0).map(r => r.emoji).join("")} {total}
        </div>
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ photo, onClose }: { photo: Photo; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(20,15,5,0.88)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div className="animate-fade-in max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ border: "1px solid rgba(201,168,76,0.3)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.thumbnailUrl} alt={photo.name} className="w-full object-contain" style={{ maxHeight: "70vh" }} />
          <div className="absolute top-3 right-3 flex gap-2">
            <a
              href={`https://drive.google.com/uc?export=download&id=${photo.id}`}
              download target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80"
              style={{ background: "rgba(201,168,76,0.85)" }}
              title="Download"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </a>
            <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80" style={{ background: "rgba(0,0,0,0.5)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="absolute bottom-0 inset-x-0 px-4 py-3 text-xs text-white/70" style={{ background: "linear-gradient(transparent,rgba(0,0,0,0.5))", fontFamily: "'Lato', sans-serif" }}>
            {new Date(photo.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
function Gallery({
  photos, loading, myVotes, mostLovedId, onVote,
}: {
  photos: Photo[];
  loading: boolean;
  myVotes: Record<string, ReactionKey>;
  mostLovedId: string | null;
  onVote: (photoId: string, reaction: ReactionKey) => void;
}) {
  const [lightbox, setLightbox] = useState<Photo | null>(null);

  if (loading && photos.length === 0) {
    return (
      <div className="photo-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="photo-item" style={{ height: `${140 + (i % 3) * 40}px`, background: "linear-gradient(90deg,#fef9e7 25%,#fdf0c0 50%,#fef9e7 75%)", backgroundSize: "200% 100%", animation: "shimmerGold 1.5s infinite" }} />
        ))}
      </div>
    );
  }

  if (!loading && photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-3">📷</div>
        <p className="text-stone-600 font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>No memories yet</p>
        <p className="text-amber-600/60 text-sm mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>Be the first to capture a moment!</p>
      </div>
    );
  }

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            index={i}
            myVote={myVotes[photo.id]}
            isMostLoved={photo.id === mostLovedId}
            onOpenLightbox={() => setLightbox(photo)}
            onVote={(reaction) => onVote(photo.id, reaction)}
          />
        ))}
      </div>
      {lightbox && <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
}

// ─── Upload modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (p: Photo) => void }) {
  const [preview,   setPreview]   = useState<string | null>(null);
  const [file,      setFile]      = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (f.size > 50 * 1024 * 1024) { setError("Image too large. Max 50 MB."); return; }
    setError(null); setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const upload = async () => {
    if (!file || !preview) return;
    setUploading(true); setError(null);
    try {
      const compressed = await compressImage(preview);
      const res  = await fetch("/api/upload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: compressed, mimeType: "image/jpeg" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      onUploaded({ id: data.fileId, name: data.fileName, thumbnailUrl: data.thumbnailUrl, createdAt: new Date().toISOString() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(20,15,5,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onClose(); }}>
      <div className="w-full sm:max-w-md sm:mx-4 animate-slide-up">
        <div className="rounded-t-3xl sm:rounded-3xl overflow-hidden" style={{ background: "#fffdf5", border: "1px solid rgba(201,168,76,0.3)" }}>
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.35)" }} />
          </div>
          <div className="flex items-center justify-between px-5 pt-3 pb-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.18)" }}>
            <div>
              <h3 className="font-bold text-stone-800 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Capture a Memory</h3>
              <p className="text-amber-600/70 text-xs mt-0.5" style={{ fontFamily: "'Lato', sans-serif" }}>Share your moment from the celebration</p>
            </div>
            {!uploading && (
              <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ color: "#a08030", background: "rgba(201,168,76,0.08)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="p-5">
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden mb-4 preview-ring">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Preview" className="w-full object-contain" style={{ maxHeight: "280px" }} />
                {!uploading && (
                  <button onClick={() => { setPreview(null); setFile(null); }} className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ) : (
              <button className="w-full rounded-2xl flex flex-col items-center justify-center py-10 mb-4"
                style={{ border: "2px dashed rgba(201,168,76,0.4)", background: "rgba(255,253,240,0.7)" }}
                onClick={() => inputRef.current?.click()}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg,#c9a84c,#a8862e)", boxShadow: "0 4px 16px rgba(180,140,40,0.35)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
                <p className="font-semibold text-stone-700 text-base" style={{ fontFamily: "'Playfair Display', serif" }}>Take or Select a Photo</p>
                <p className="text-amber-600/60 text-xs mt-1" style={{ fontFamily: "'Lato', sans-serif" }}>Tap to open your camera or gallery</p>
              </button>
            )}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {error && <p className="text-red-600 text-sm text-center mb-3" style={{ fontFamily: "'Lato', sans-serif" }}>⚠ {error}</p>}
            <div className="flex gap-3">
              {preview && !uploading && (
                <button onClick={() => inputRef.current?.click()} className="flex-1 py-3 rounded-2xl text-sm font-medium"
                  style={{ background: "rgba(201,168,76,0.1)", color: "#8b6914", border: "1px solid rgba(201,168,76,0.3)", fontFamily: "'Lato', sans-serif" }}>
                  Retake
                </button>
              )}
              <button onClick={preview ? upload : () => inputRef.current?.click()} disabled={uploading}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 active:opacity-80 disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#c9a84c,#a8862e)", boxShadow: "0 4px 16px rgba(180,140,40,0.35)", fontFamily: "'Lato', sans-serif" }}>
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />Uploading…</>
                ) : preview ? <><span>✦</span> Share Memory</> : <><span>📷</span> Open Camera</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MemoriesPage() {
  const [photos,     setPhotos]     = useState<Photo[]>([]);
  const [galLoading, setGalLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [toast,      setToast]      = useState<{ msg: string; type: "success" | "error"; visible: boolean } | null>(null);
  const [myVotes,    setMyVotes]    = useState<Record<string, ReactionKey>>({});

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type, visible: true });
    setTimeout(() => setToast((t) => t ? { ...t, visible: false } : null), 3000);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Load saved votes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ndw_votes");
      if (stored) setMyVotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const fetchPhotos = useCallback(async () => {
    try {
      const res  = await fetch("/api/photos");
      const data = await res.json();
      if (data.success && Array.isArray(data.photos)) setPhotos(data.photos);
    } catch { /* silent */ } finally { setGalLoading(false); }
  }, []);

  useEffect(() => {
    fetchPhotos();
    const id = setInterval(fetchPhotos, 30_000);
    return () => clearInterval(id);
  }, [fetchPhotos]);

  // Photo with most votes
  const mostLovedId = useMemo(() => {
    if (photos.length === 0) return null;
    let maxV = 0, maxId: string | null = null;
    photos.forEach((p) => {
      const t = totalVotes(p.votes);
      if (t > maxV) { maxV = t; maxId = p.id; }
    });
    return maxV > 0 ? maxId : null;
  }, [photos]);

  const handleVote = useCallback(async (photoId: string, reaction: ReactionKey) => {
    const prevReaction = myVotes[photoId] as ReactionKey | undefined;
    const nextReaction = prevReaction === reaction ? undefined : reaction;

    // Optimistic UI update
    setPhotos((prev) => prev.map((p) => {
      if (p.id !== photoId) return p;
      const v = { h: 0, f: 0, w: 0, ...p.votes };
      if (prevReaction) v[prevReaction] = Math.max(0, v[prevReaction] - 1);
      if (nextReaction) v[nextReaction]++;
      return { ...p, votes: v };
    }));

    const next = { ...myVotes };
    if (nextReaction) next[photoId] = nextReaction;
    else delete next[photoId];
    setMyVotes(next);
    localStorage.setItem("ndw_votes", JSON.stringify(next));

    // Sync to server
    try {
      await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId, reaction: nextReaction ?? null, prevReaction: prevReaction ?? null }),
      });
    } catch { /* silent — optimistic update is already applied */ }
  }, [myVotes]);

  const handleUploaded = (photo: Photo) => {
    setPhotos((prev) => [photo, ...prev]);
    showToast("Memory shared! ✦ Thank you!", "success");
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <FloatingPetals />

      {/* ── Hero ── */}
      <section className="relative z-10 hero-bg pt-12 pb-10 px-4 text-center">
        <p className="text-stone-400 text-xs uppercase tracking-[0.45em] mb-4" style={{ fontFamily: "'Lato', sans-serif" }}>
          18 · 05 · 2026
        </p>
        <h1 className="font-bold text-stone-800 leading-none mb-1 animate-fade-up" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem,9vw,4.5rem)" }}>
          Nushan
        </h1>
        <p className="text-amber-600/60 text-lg mb-1 animate-fade-up" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", animationDelay: "0.08s" }}>
          &amp;
        </p>
        <h1 className="font-bold text-stone-800 leading-none animate-fade-up" style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem,9vw,4.5rem)", animationDelay: "0.12s" }}>
          Dineshka
        </h1>
        <div className="divider my-5 px-8 animate-fade-up" style={{ animationDelay: "0.18s" }}>
          <span className="text-amber-500 text-xs">❧</span>
        </div>
        <p className="text-stone-600 text-base mb-2 animate-fade-up" style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", animationDelay: "0.22s" }}>
          Share your memories from our special day
        </p>
        <p className="text-amber-600/60 text-xs animate-fade-up" style={{ fontFamily: "'Lato', sans-serif", animationDelay: "0.28s" }}>
          Photos upload instantly and appear in the gallery below
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="mt-7 inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl text-white font-semibold text-base active:scale-95 animate-fade-up"
          style={{ background: "linear-gradient(135deg,#c9a84c 0%,#8b6914 100%)", boxShadow: "0 6px 24px rgba(180,140,40,0.4)", fontFamily: "'Lato', sans-serif", animationDelay: "0.32s" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          Capture the Moment
        </button>
        {photos.length > 0 && (
          <p className="mt-5 text-amber-700/70 text-sm animate-fade-up" style={{ fontFamily: "'Lato', sans-serif", animationDelay: "0.38s" }}>
            <span className="font-bold text-amber-700">{photos.length}</span> {photos.length === 1 ? "memory" : "memories"} shared so far ✦
          </p>
        )}
      </section>

      {/* ── Gallery ── */}
      <section className="relative z-10 max-w-2xl mx-auto px-3 py-8">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-stone-800 font-bold text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Wedding Gallery
          </h2>
          <button
            onClick={fetchPhotos}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full active:scale-95"
            style={{ background: "rgba(201,168,76,0.1)", color: "#8b6914", border: "1px solid rgba(201,168,76,0.3)", fontFamily: "'Lato', sans-serif" }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Refresh
          </button>
        </div>

        {/* Vote banner */}
        {photos.length > 0 && <VoteBanner />}

        <Gallery
          photos={photos}
          loading={galLoading}
          myVotes={myVotes}
          mostLovedId={mostLovedId}
          onVote={handleVote}
        />
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 text-center py-8 px-4">
        <div className="divider px-8 mb-5">
          <span className="text-amber-500 text-xs">✦</span>
        </div>
        <p className="text-stone-700 font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>Nushan &amp; Dineshka</p>
        <p className="text-amber-600/60 text-xs mt-1" style={{ fontFamily: "'Lato', sans-serif", letterSpacing: "0.15em" }}>18 · 05 · 2026</p>
        <div className="flex justify-center gap-2 mt-3">
          <span style={{ color: "#c9a84c" }}>✿</span>
          <span style={{ color: "#d4af60" }}>❀</span>
          <span style={{ color: "#c9a84c" }}>✿</span>
        </div>
      </footer>

      {/* ── FAB ── */}
      <button onClick={() => setShowUpload(true)} className="fixed bottom-6 right-5 z-40 flex flex-col items-center gap-1 group" aria-label="Share a memory">
        <span className="absolute inset-0 rounded-full" style={{ background: "#c9a84c", borderRadius: "50%", animation: "pulse-ring 2.4s ease-in-out infinite", opacity: 0.35 }} aria-hidden />
        <span className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg,#c9a84c,#8b6914)", boxShadow: "0 6px 20px rgba(180,140,40,0.45)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </span>
        <span className="relative text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,253,240,0.95)", color: "#8b6914", fontFamily: "'Lato', sans-serif", boxShadow: "0 2px 8px rgba(180,140,40,0.18)", fontSize: "10px" }}>
          Share
        </span>
      </button>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
      {toast && <Toast message={toast.msg} type={toast.type} visible={toast.visible} />}
    </div>
  );
}
